import { createClient } from "@/utils/supabase/client";
import type { Event, Category } from "@/lib/mock-data";

export function adaptDbEvent(e: DbEvent, registrationCount = 0): Event {
  return {
    id: e.id,
    title: e.title,
    category: e.category as Category,
    description: e.description,
    date: e.date,
    endDate: e.end_date ?? undefined,
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
    status: e.status as Event["status"],
    views: 0,
    registrations: registrationCount,
  };
}

async function getRegistrationCounts(): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data } = await supabase.from("registrations").select("event_id");
  const counts: Record<string, number> = {};
  (data ?? []).forEach((r) => { counts[r.event_id] = (counts[r.event_id] ?? 0) + 1; });
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
  created_at: string;
  updated_at: string;
};

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
  return events.map((e) => adaptDbEvent(e, counts[e.id] ?? 0));
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
  const supabase = createClient();
  const [raw, { count }] = await Promise.all([
    getEvent(id),
    supabase.from("registrations").select("*", { count: "exact", head: true }).eq("event_id", id),
  ]);
  return raw ? adaptDbEvent(raw, count ?? 0) : null;
}

export async function createEvent(payload: Omit<DbEvent, "id" | "created_at" | "updated_at">): Promise<DbEvent> {
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
      event_title: ev.title as string ?? "",
      event_date: ev.date as string ?? "",
      event_time: ev.time as string ?? "",
      event_end_time: ev.end_time as string | null ?? null,
      event_venue: ev.venue as string ?? "",
      event_fee: ev.registration_fee as number ?? 0,
    };
  });
}

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

export async function registerForEvent(eventId: string, info: {
  name: string;
  email: string;
  department?: string;
  year?: string;
  fee: number;
}): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("registrations").insert({
    event_id: eventId,
    user_id: user.id,
    student_name: info.name,
    student_email: info.email,
    student_department: info.department ?? null,
    student_year: info.year ?? null,
    payment_status: info.fee === 0 ? "free" : "pending",
  });
  if (error) throw error;
}

export async function cancelRegistration(eventId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("registrations")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id);
  if (error) throw error;
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
    .maybeSingle();
  return !!data;
}

export async function toggleAttendance(registrationId: string, attended: boolean): Promise<void> {
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
  const supabase = createClient();
  const { error } = await supabase.from("survey_questions").delete().eq("id", id);
  if (error) throw error;
}

export async function updateSurveyQuestion(id: string, updates: Partial<Pick<DbSurveyQuestion, "question" | "type" | "required" | "sort_order">>): Promise<void> {
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

export async function getStudentRegistrationsWithEvents(userId: string): Promise<StudentRegistrationWithEvent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("registrations")
    .select("*, events(title, date, time, end_time, venue, registration_fee)")
    .eq("user_id", userId)
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
