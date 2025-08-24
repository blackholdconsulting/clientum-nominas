// lib/auth.ts
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

/** Devuelve el usuario autenticado o redirige a /auth si no hay sesión */
export async function requireUser() {
  const supabase = supabaseServer();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    // Mantén el next si ya lo pasas en la URL actual
    redirect("/auth?next=" + encodeURIComponent("/"));
  }
  return data.user;
}

/** Obtiene el usuario si existe (sin redirigir) */
export async function getUserOptional() {
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}
