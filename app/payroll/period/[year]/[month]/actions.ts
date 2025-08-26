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

// Intenta extraer un ID de data en muchas formas distintas
function extractId(data: any): number | null {
  if (data == null) return null;

  // Si es número o string numérico, listo
  if (typeof data === "number") return data;
  if (typeof data === "string") {
    const n = Number(data);
    return Number.isFinite(n) ? n : null;
  }

  // Si es array, mira el primero
  if (Array.isArray(data)) return extractId(data[0]);

  if (typeof data === "object") {
    const candidates = [
      "payroll_id",
      "id",
      "v_id",
      "value",
      "result",
      "data",
    ];
    for (const k of candidates) {
      if (k in data) {
        const v = (data as any)[k];
        const id = extractId(v);
        if (id != null) return id;
      }
    }
  }

  return null;
}

/**
 * Crea (o reusa) el borrador de nómina para (year,month) y devuelve { ok, id | error }.
 * — No hace redirect — lo hace el cliente para evitar NEXT_REDIRECT.
 */
export async function createPeriodDraft(year: number, month: number) {
  try {
    const supabase = getSupabase();

    // 1) intenta con p_year/p_month
    let { data, error } = await supabase.rpc("payroll_generate_period", {
      p_year: year,
      p_month: month,
    });

    // 2) si esa signatura no existe, intenta con year/month
    if ((data == null || error) && !process.env.BLOCK_RPC_FALLBACK) {
      const res2 = await supabase.rpc("payroll_generate_period", {
        year,
        month,
      });
      data = res2.data;
      error = res2.error;
    }

    if (error) {
      return { ok: false as const, error: error.message };
    }

    const id = extractId(data);
    if (!id) {
      // Devuelve algo útil por si hace falta revisar en UI
      return {
        ok: false as const,
        error: "Respuesta inválida del generador de nóminas.",
      };
    }

    return { ok: true as const, id };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || String(e) };
  }
}
