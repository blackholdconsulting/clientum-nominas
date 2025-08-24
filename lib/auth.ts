// lib/auth.ts
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/** No lanza: devuelve {supabase, user|null} */
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

/** Redirige a /auth si no hay sesión. */
export async function hardRequireUser(nextPath: string = "/") {
  const { supabase, user } = await softRequireUser();
  if (!user) redirect(`/auth?next=${encodeURIComponent(nextPath)}`);
  return { supabase, user };
}

/**
 * 🔁 Shim de compatibilidad:
 * muchos archivos importan { requireUser } de "@/lib/auth".
 * Lo mantenemos como alias de hardRequireUser para no romper importaciones.
 */
export async function requireUser(nextPath?: string) {
  return hardRequireUser(typeof nextPath === "string" ? nextPath : "/");
}
