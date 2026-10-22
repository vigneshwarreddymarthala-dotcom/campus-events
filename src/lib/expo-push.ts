import type { SupabaseClient } from "@supabase/supabase-js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Sends a phone alert to every registered device of the given users. Never throws:
// push is a bonus on top of the in-app bell, which is saved separately.
export async function sendExpoPush(
  admin: SupabaseClient,
  userIds: string[],
  title: string,
  message: string,
  eventId?: string | null
): Promise<{ sent: number; devices: number }> {
  if (userIds.length === 0) return { sent: 0, devices: 0 };
  const { data: rows } = await admin.from("push_tokens").select("token").in("user_id", userIds);
  const tokens = [...new Set((rows ?? []).map((r) => r.token as string))].filter((t) => t.startsWith("ExponentPushToken"));
  if (tokens.length === 0) return { sent: 0, devices: 0 };

  let sent = 0;
  const dead: string[] = [];
  for (let i = 0; i < tokens.length; i += 100) {
    const batch = tokens.slice(i, i + 100);
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(
        batch.map((to) => ({ to, title, body: message, sound: "default", channelId: "default", data: eventId ? { eventId } : {} }))
      ),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    (json?.data ?? []).forEach((t: { status: string; details?: { error?: string } }, idx: number) => {
      if (t.status === "ok") sent++;
      else if (t.details?.error === "DeviceNotRegistered") dead.push(batch[idx]);
    });
  }
  if (dead.length) await admin.from("push_tokens").delete().in("token", dead);
  return { sent, devices: tokens.length };
}
