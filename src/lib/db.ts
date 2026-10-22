import { createClient } from "@/utils/supabase/client";
import type { Event, Category } from "@/lib/mock-data";

async function assertAdmin(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (data?.role !== "admin") throw new Error("Forbidden: admin only");
}

// Organizers have full access; event_head accounts may only touch the
// event they own — actual scoping is enforced by RLS, this is just the
// friendly client-side gate matching assertAdmin's shape.
async function assertCanManageEvents(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (data?.role !== "admin" && data?.role !== "event_head") throw new Error("Forbidden: organizer only");
}

export function adaptDbEvent(e: DbEvent, registrationCount = 0, waitlistCount = 0): Event {
  let parsedStatus = e.status as Event["status"];
  let publishAt: string | undefined = e.publish_at ?? undefined;

  // Fallback for mock data or before migration
  if (e.status.startsWith("scheduled:")) {
    publishAt = e.status.split("scheduled:")[1];
  }

  if (publishAt && new Date() >= new Date(publishAt)) {
    try {
      const match = (e.time ?? "23:59").match(/^(\d{1,2}):(\d{2})/);
      const timeFormatted = match ? `${match[1].padStart(2, '0')}:${match[2]}` : "23:59";
      const eventDate = new Date(`${e.end_date || e.date}T${timeFormatted}:00`);
      
      if (isNaN(eventDate.getTime())) {
        const justDate = new Date(e.end_date || e.date);
        justDate.setHours(23, 59, 59);
        parsedStatus = justDate < new Date() ? "completed" : "upcoming";
      } else {
        parsedStatus = eventDate < new Date() ? "completed" : "upcoming";
      }
    } catch (err) {
      parsedStatus = "upcoming";
    }
  } else if (publishAt && new Date() < new Date(publishAt)) {
    parsedStatus = "scheduled";
  }

  return {
    id: e.id,
    title: e.title,
    category: e.category as Category,
    description: e.description,
    date: e.date,
    endDate: e.end_date ?? undefined,
    endTime: e.end_time ?? undefined,
    time: e.time,
    venue: e.venue,
    bannerImage: e.banner_image,
    bannerLink: e.banner_link ?? undefined,
    ticketUrl: e.ticket_url ?? undefined,
    gallery: [],
    organizer: e.organizer_name,
    contactEmail: e.organizer_email,
    registrationDeadline: e.date,
    capacity: e.capacity,
    registrationFee: e.registration_fee,
    eligibility: "Open to all",
    tags: e.tags ?? [],
    attachments: [],
    status: parsedStatus,
    publishAt,
    views: 0,
    registrations: registrationCount,
    waitlistCount,
  };
}

type RegistrationCounts = Record<string, { seats: number; waiting: number }>;

async function getRegistrationCounts(): Promise<RegistrationCounts> {
  // Security-definer function: everyone sees the real totals while row-level
  // security keeps individual registrations private. "seats" = confirmed, "waiting" = on the waiting list.
  const supabase = createClient();
  const { data } = await supabase.rpc("event_registration_counts");
  const counts: RegistrationCounts = {};
  ((data ?? []) as { event_id: string; registrations: number; waiting?: number }[]).forEach((r) => {
    counts[r.event_id] = { seats: Number(r.registrations), waiting: Number(r.waiting ?? 0) };
  });
  return counts;
}

export type DbEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  end_date: string | null;
  time: string;
  end_time: string | null;
  venue: string;
  category: string;
  status: string;
  capacity: number;
  registration_fee: number;
  organizer_name: string;
  organizer_email: string;
  organizer_department: string;
  tags: string[];
  banner_image: string;
  banner_link?: string | null;
  ticket_url?: string | null;
  requirements: string[];
  created_by: string | null;
  publish_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type RegistrationStatus = "confirmed" | "waitlist" | "cancelled";

export type DbRegistration = {
  id: string;
  event_id: string;
  user_id: string;
  student_name: string;
  student_email: string;
  student_department: string | null;
  student_year: string | null;
  payment_status: string;
  attended: boolean;
  registered_at: string;
  status: RegistrationStatus;
  cancel_reason: string | null;
  cancelled_at: string | null;
  cancelled_from: string | null;
};

// ── Events ───────────────────────────────────────────────────

export async function getEvents(): Promise<DbEvent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getAdaptedEvents(): Promise<Event[]> {
  const [events, counts] = await Promise.all([getEvents(), getRegistrationCounts()]);
  return events.map((e) => adaptDbEvent(e, counts[e.id]?.seats ?? 0, counts[e.id]?.waiting ?? 0));
}

export async function getEvent(id: string): Promise<DbEvent | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function getAdaptedEvent(id: string): Promise<Event | null> {
  const [raw, counts] = await Promise.all([getEvent(id), getRegistrationCounts()]);
  return raw ? adaptDbEvent(raw, counts[id]?.seats ?? 0, counts[id]?.waiting ?? 0) : null;
}

export async function createEvent(payload: Omit<DbEvent, "id" | "created_at" | "updated_at">): Promise<DbEvent> {
  await assertCanManageEvents();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id: string, payload: Partial<DbEvent>): Promise<DbEvent> {
  await assertCanManageEvents();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  await assertAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

// ── Registrations ─────────────────────────────────────────────

export async function getMyRegistrations(): Promise<DbRegistration[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .eq("user_id", user.id)
    .neq("status", "cancelled")
    .order("registered_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMyRegistrationsWithEvents(): Promise<StudentRegistrationWithEvent[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("registrations")
    .select("*, events(title, date, time, end_time, venue, registration_fee)")
    .eq("user_id", user.id)
    .neq("status", "cancelled")
    .order("registered_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: Record<string, unknown>) => {
    const ev = r.events as Record<string, unknown> ?? {};
    return {
      id: r.id as string,
      event_id: r.event_id as string,
      user_id: r.user_id as string,
      student_name: r.student_name as string,
      student_email: r.student_email as string,
      student_department: r.student_department as string | null,
      student_year: r.student_year as string | null,
      payment_status: r.payment_status as string,
      attended: r.attended as boolean,
      registered_at: r.registered_at as string,
      status: (r.status as RegistrationStatus) ?? "confirmed",
      cancel_reason: (r.cancel_reason as string | null) ?? null,
      cancelled_at: (r.cancelled_at as string | null) ?? null,
      cancelled_from: (r.cancelled_from as string | null) ?? null,
      event_title: ev.title as string ?? "",
      event_date: ev.date as string ?? "",
      event_time: ev.time as string ?? "",
      event_end_time: ev.end_time as string | null ?? null,
      event_venue: ev.venue as string ?? "",
      event_fee: ev.registration_fee as number ?? 0,
    };
  });
}

// Only students who hold a seat (not waiting, not cancelled): use this for counts, attendance and certificates.
export async function getEventSeatRegistrations(eventId: string): Promise<DbRegistration[]> {
  return (await getEventRegistrations(eventId)).filter((r) => r.status === "confirmed");
}

// Every registration of an event, whatever its status (organizer lists).
export async function getEventRegistrations(eventId: string): Promise<DbRegistration[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .eq("event_id", eventId)
    .order("registered_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Returns "confirmed" if a seat was free, or "waitlist" if the event is full. The database decides.
export async function registerForEvent(eventId: string, info: {
  name: string;
  email: string;
  department?: string;
  year?: string;
  fee: number;
}): Promise<"confirmed" | "waitlist"> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase.rpc("register_for_event", {
    p_event_id: eventId,
    p_name: info.name,
    p_email: info.email,
    p_department: info.department ?? null,
    p_year: info.year ?? null,
    p_payment_status: info.fee === 0 ? "free" : "pending",
  });
  if (error) throw error;
  return data === "waitlist" ? "waitlist" : "confirmed";
}

// Cancel a seat (a reason is required) or leave the waiting list (reason optional).
// The freed seat goes to the first student waiting.
export async function cancelRegistration(eventId: string, reason = ""): Promise<{ was: string; moved_up: number }> {
  const res = await fetch("/api/registrations/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, reason }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Could not cancel. Please try again.");
  return json;
}

export type MyRegistrationState = { status: RegistrationStatus | null; position: number | null };

export async function getMyRegistrationState(eventId: string): Promise<MyRegistrationState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: null, position: null };
  const { data } = await supabase
    .from("registrations")
    .select("status")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();
  const status = (data?.status as RegistrationStatus | undefined) ?? null;
  let position: number | null = null;
  if (status === "waitlist") {
    const { data: pos } = await supabase.rpc("my_waitlist_position", { p_event_id: eventId });
    position = typeof pos === "number" ? pos : null;
  }
  return { status, position };
}

// Organizer: move a student between Registered and the Waiting list.
export async function setRegistrationStatus(registrationId: string, status: "confirmed" | "waitlist"): Promise<void> {
  await assertCanManageEvents();
  const supabase = createClient();
  const { data, error } = await supabase.rpc("set_registration_status", { p_registration_id: registrationId, p_status: status });
  if (error) throw error;
  const r = data as { user_id: string; event_id: string; title: string; moved_up: boolean };
  if (r?.moved_up) pushToPhones([r.user_id], "You're in!", `A spot opened up for ${r.title}. Your registration is now confirmed.`, r.event_id);
}

// True only if the organizer (or the QR check-in) marked this student present at the event.
export async function didIAttend(eventId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("registrations")
    .select("attended")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data?.attended;
}

export async function isRegisteredForEvent(eventId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .maybeSingle();
  return !!data;
}

export async function toggleAttendance(registrationId: string, attended: boolean): Promise<void> {
  await assertCanManageEvents();
  const supabase = createClient();
  const { error } = await supabase
    .from("registrations")
    .update({ attended })
    .eq("id", registrationId);
  if (error) throw error;
}

export async function markMyAttendance(eventId: string): Promise<"ok" | "not_registered" | "already_marked"> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("mark_attendance", { p_event_id: eventId });
  if (error) throw error;
  return data as "ok" | "not_registered" | "already_marked";
}

// ── Bookmarks ─────────────────────────────────────────────────

export async function getMyBookmarks(): Promise<string[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("bookmarks")
    .select("event_id")
    .eq("user_id", user.id);
  if (error) throw error;
  return (data ?? []).map((r) => r.event_id);
}

export async function addBookmark(eventId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("bookmarks").insert({ user_id: user.id, event_id: eventId });
  if (error && error.code !== "23505") throw error;
}

export async function removeBookmark(eventId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("event_id", eventId);
  if (error) throw error;
}

// ── Surveys ───────────────────────────────────────────────────

export type DbSurvey = {
  id: string;
  event_id: string;
  user_id: string;
  student_name: string;
  student_email: string;
  rating: number;
  organization_rating: number;
  would_recommend: boolean;
  liked_most: string | null;
  could_improve: string | null;
  other_feedback: string | null;
  custom_answers: Record<string, string | number | boolean> | null;
  submitted_at: string;
};

export type DbSurveyQuestion = {
  id: string;
  event_id: string;
  question: string;
  type: "text" | "rating" | "yesno";
  required: boolean;
  sort_order: number;
};

export async function getSurveyQuestions(eventId: string): Promise<DbSurveyQuestion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("survey_questions")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addSurveyQuestion(
  eventId: string,
  question: string,
  type: DbSurveyQuestion["type"],
  required: boolean,
  sortOrder: number
): Promise<DbSurveyQuestion> {
  await assertCanManageEvents();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("survey_questions")
    .insert({ event_id: eventId, question, type, required, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSurveyQuestion(id: string): Promise<void> {
  await assertCanManageEvents();
  const supabase = createClient();
  const { error } = await supabase.from("survey_questions").delete().eq("id", id);
  if (error) throw error;
}

export async function updateSurveyQuestion(id: string, updates: Partial<Pick<DbSurveyQuestion, "question" | "type" | "required" | "sort_order">>): Promise<void> {
  await assertCanManageEvents();
  const supabase = createClient();
  const { error } = await supabase.from("survey_questions").update(updates).eq("id", id);
  if (error) throw error;
}

export async function submitSurvey(
  eventId: string,
  data: {
    rating: number;
    organization_rating: number;
    would_recommend: boolean;
    liked_most?: string;
    could_improve?: string;
    other_feedback?: string;
    custom_answers?: Record<string, string | number | boolean>;
  }
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("name, email").eq("id", user.id).single();
  const { error } = await supabase.from("event_surveys").insert({
    event_id: eventId,
    user_id: user.id,
    student_name: profile?.name ?? user.email ?? "",
    student_email: profile?.email ?? user.email ?? "",
    rating: data.rating,
    organization_rating: data.organization_rating,
    would_recommend: data.would_recommend,
    liked_most: data.liked_most || null,
    could_improve: data.could_improve || null,
    other_feedback: data.other_feedback || null,
    custom_answers: data.custom_answers ?? {},
  });
  if (error) throw error;
}

export async function getMyEventSurvey(eventId: string): Promise<DbSurvey | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("event_surveys")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();
  return data ?? null;
}

export async function getEventSurveys(eventId: string): Promise<DbSurvey[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("event_surveys")
    .select("*")
    .eq("event_id", eventId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ── Notifications ─────────────────────────────────────────────

export type DbNotification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  event_id: string | null;
  read: boolean;
  sent_by: string | null;
  created_at: string;
};

export async function getMyNotifications(): Promise<DbNotification[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return [];
  return data ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
}

// Also deliver the message as a phone push notification (best effort: the in-app
// notification is already saved, so a push failure never blocks the organizer).
function pushToPhones(userIds: string[], title: string, message: string, eventId?: string) {
  fetch("/api/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userIds, title, message, eventId: eventId ?? null }),
  }).catch(() => {});
}

export async function sendNotification(userId: string, title: string, message: string, eventId?: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    event_id: eventId ?? null,
    sent_by: user.id,
  });
  if (error) throw error;
  pushToPhones([userId], title, message, eventId);
}

export async function sendNotificationToUsers(
  userIds: string[],
  title: string,
  message: string,
  eventId?: string
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("notifications").insert(
    userIds.map((uid) => ({ user_id: uid, title, message, event_id: eventId ?? null, sent_by: user.id }))
  );
  if (error) throw error;
  pushToPhones(userIds, title, message, eventId);
}

// ── Admin: Students ───────────────────────────────────────────

export type DbProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  year: string | null;
  phone: string | null;
};

export type StudentRegistrationWithEvent = DbRegistration & {
  event_title: string;
  event_date: string;
  event_time: string;
  event_end_time: string | null;
  event_venue: string;
  event_fee: number;
};

export async function getAllStudents(): Promise<DbProfile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getAllOrganizers(): Promise<DbProfile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["admin", "event_head"])
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getMyEventId(userId: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id")
    .eq("created_by", userId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function getStudentRegistrationsWithEvents(userId: string): Promise<StudentRegistrationWithEvent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("registrations")
    .select("*, events(title, date, time, end_time, venue, registration_fee)")
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .order("registered_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: Record<string, unknown>) => {
    const ev = r.events as Record<string, unknown> ?? {};
    return {
      id: r.id as string,
      event_id: r.event_id as string,
      user_id: r.user_id as string,
      student_name: r.student_name as string,
      student_email: r.student_email as string,
      student_department: r.student_department as string | null,
      student_year: r.student_year as string | null,
      payment_status: r.payment_status as string,
      attended: r.attended as boolean,
      registered_at: r.registered_at as string,
      status: (r.status as RegistrationStatus) ?? "confirmed",
      cancel_reason: (r.cancel_reason as string | null) ?? null,
      cancelled_at: (r.cancelled_at as string | null) ?? null,
      cancelled_from: (r.cancelled_from as string | null) ?? null,
      event_title: ev.title as string ?? "",
      event_date: ev.date as string ?? "",
      event_time: ev.time as string ?? "",
      event_end_time: ev.end_time as string | null ?? null,
      event_venue: ev.venue as string ?? "",
      event_fee: ev.registration_fee as number ?? 0,
    };
  });
}

export async function getStudentProfile(userId: string): Promise<DbProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
}

export async function cloneEvent(id: string): Promise<string> {
  const supabase = createClient();
  const { data: ev, error } = await supabase.from("events").select("*").eq("id", id).single();
  if (error || !ev) throw error ?? new Error("Event not found");
  const { id: _id, created_at, updated_at, ...rest } = ev;
  const { data, error: insertErr } = await supabase
    .from("events")
    .insert({ ...rest, title: `Copy of ${ev.title}`, status: "upcoming" })
    .select("id")
    .single();
  if (insertErr) throw insertErr;
  return data.id;
}
