"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function getSupabase() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options });
      },
    },
  });
}

/**
 * Crea (o reenlaza) el borrador de nómina del periodo y devuelve { ok, id | error }.
 * IMPORTANTE: no hace redirect — la navegación la hace el cliente.
 */
export async function createPeriodDraft(year: number, month: number) {
  try {
    const supabase = getSupabase();

    // Llama a la función SQL. Ajusta los nombres si tu función usa otros parámetros.
    const { data, error } = await supabase.rpc("payroll_generate_period", {
      p_year: year,
      p_month: month,
    });

    if (error) {
      return { ok: false as const, error: error.message };
    }

    // La función que preparamos devuelve algo como { ok: true, payroll_id: <id> }
    const id =
      (data as any)?.payroll_id ??
      (data as any)?.value ??
      (data as any)?.id ??
      null;

    if (!id) {
      return { ok: false as const, error: "Respuesta inválida del generador de nóminas." };
    }

    return { ok: true as const, id };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || String(e) };
  }
}
