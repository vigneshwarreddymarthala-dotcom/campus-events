import { type NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("") + "!7";
}

// Organizer-assisted reset: sets a temporary password for a student and returns it once.
// Works without any email service. Staff only; only student accounts can be reset here.
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: caller } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!caller || !["admin", "super_admin"].includes(caller.role)) {
    return NextResponse.json({ error: "Only organizers can reset passwords." }, { status: 403 });
  }

  const { userId } = await request.json().catch(() => ({}));
  if (typeof userId !== "string" || !userId) {
    return NextResponse.json({ error: "Missing student." }, { status: 400 });
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: target } = await service.from("profiles").select("role").eq("id", userId).single();
  if (!target || target.role !== "student") {
    return NextResponse.json({ error: "Only student accounts can be reset here." }, { status: 400 });
  }

  const password = generatePassword();
  const { error } = await service.auth.admin.updateUserById(userId, { password });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ password });
}
