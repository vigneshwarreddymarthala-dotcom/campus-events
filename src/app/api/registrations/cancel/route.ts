import { type NextRequest, NextResponse } from "next/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { sendExpoPush } from "@/lib/expo-push";

// A student cancels (or leaves the waiting list). The database does the real work in one safe step:
// it marks the registration Cancelled with the reason and gives the freed seat to the first person waiting.
// Here we only add the phone alerts for the student who moved up and for the organizer.
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

  const body = (await req.json().catch(() => null)) as { eventId?: string; reason?: string } | null;
  const eventId = typeof body?.eventId === "string" ? body.eventId : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 300) : "";
  if (!eventId) return NextResponse.json({ error: "Missing event." }, { status: 400 });

  const { data, error } = await supabase.rpc("cancel_my_registration", { p_event_id: eventId, p_reason: reason });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const result = data as { was: string; promoted: string[]; owner: string | null; title: string; student: string };
  const admin = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  // Best effort: the bell notifications were already saved by the database.
  await Promise.all([
    sendExpoPush(admin, result.promoted ?? [], "You're in!", `A spot opened up for ${result.title}. Your registration is now confirmed.`, eventId),
    result.owner
      ? sendExpoPush(admin, [result.owner], "Registration cancelled", `${result.student} cancelled for ${result.title}${reason ? `: ${reason}` : "."}`, eventId)
      : Promise.resolve(),
  ]).catch(() => {});

  return NextResponse.json({ was: result.was, moved_up: (result.promoted ?? []).length });
}
