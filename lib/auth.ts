// lib/auth.ts
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

/** Devuelve el usuario autenticado o redirige a /auth si no hay sesión */
export async function requireUser() {
  const supabase = supabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth?next=" + encodeURIComponent("/"));
  }

  return user;
}

/** Obtiene el usuario si existe (sin redirigir) */
export async function getUserOptional() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}
