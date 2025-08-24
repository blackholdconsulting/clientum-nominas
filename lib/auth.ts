import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function softRequireUser() {
  const supabase = getSupabaseServerClient();
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { supabase, user: data.user ?? null };
  } catch {
    return { supabase, user: null as any };
  }
}

export async function hardRequireUser(nextPath: string = "/") {
  const { supabase, user } = await softRequireUser();
  if (!user) redirect(`/auth?next=${encodeURIComponent(nextPath)}`);
  return { supabase, user };
}
