import { type NextRequest, NextResponse } from "next/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

const STAFF_ROLES = ["admin", "super_admin", "event_head"];
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Sends a phone push notification to the given students. Called right after an
// organizer saves an in-app notification, so the message also reaches lock screens.
export async function POST(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  const supabase = bearer
    ? createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${bearer}` } },
      })
    : await createClient();
  const { data: { user } } = bearer ? await supabase.auth.getUser(bearer) : await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: "Only organizers can send notifications." }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as
    | { userIds?: string[]; title?: string; message?: string; eventId?: string | null }
    | null;
  const userIds = Array.isArray(body?.userIds) ? body!.userIds.filter((x) => typeof x === "string").slice(0, 5000) : [];
  const title = body?.title?.toString().slice(0, 100);
  const message = body?.message?.toString().slice(0, 500);
  if (!title || !message || userIds.length === 0) {
    return NextResponse.json({ error: "Missing title, message or recipients." }, { status: 400 });
  }

  const admin = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data: rows } = await admin.from("push_tokens").select("token").in("user_id", userIds);
  const tokens = [...new Set((rows ?? []).map((r) => r.token as string))].filter((t) => t.startsWith("ExponentPushToken"));
  if (tokens.length === 0) return NextResponse.json({ sent: 0, devices: 0 });

  let sent = 0;
  const dead: string[] = [];
  for (let i = 0; i < tokens.length; i += 100) {
    const batch = tokens.slice(i, i + 100);
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(
        batch.map((to) => ({
          to,
          title,
          body: message,
          sound: "default",
          channelId: "default",
          data: body?.eventId ? { eventId: body.eventId } : {},
        }))
      ),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    (json?.data ?? []).forEach((t: { status: string; details?: { error?: string } }, idx: number) => {
      if (t.status === "ok") sent++;
      else if (t.details?.error === "DeviceNotRegistered") dead.push(batch[idx]);
    });
  }
  if (dead.length) await admin.from("push_tokens").delete().in("token", dead);
  return NextResponse.json({ sent, devices: tokens.length });
}
