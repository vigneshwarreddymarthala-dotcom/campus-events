import type { NextRequest } from "next/server";
import { createClient as createSupabase, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

// Signs the caller in for an API route. The website sends a session cookie; the mobile apps send a Bearer token.
export async function getRouteUser(req: NextRequest): Promise<{ supabase: SupabaseClient; user: User | null }> {
  const bearer = req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  const supabase = bearer
    ? createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${bearer}` } },
      })
    : await createClient();
  const { data: { user } } = bearer ? await supabase.auth.getUser(bearer) : await supabase.auth.getUser();
  return { supabase, user };
}
