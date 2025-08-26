"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function createSb() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function generateDraft(year: number, month: number) {
  const sb = createSb();

  const { data, error } = await sb.rpc("payroll_generate_period", {
    p_year: year,
    p_month: month,
  });

  if (error) throw new Error(error.message || "Error al generar nómina.");

  // El RPC puede devolver distintos nombres para el id (según versión)
  let id =
    (data as any)?.payroll_id ??
    (data as any)?.v_id ??
    (data as any)?.id ??
    undefined;

  if (!id) {
    // Fallback: coge la nómina creada/abierta del usuario para ese periodo
    const { data: row, error: e2 } = await sb
      .from("payrolls")
      .select("id")
      .eq("period_year", year)
      .eq("period_month", month)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (e2) throw new Error(e2.message);
    if (!row) throw new Error("Respuesta inválida del generador de nóminas.");
    id = row.id;
  }

  return { ok: true, payroll_id: id as number };
}
