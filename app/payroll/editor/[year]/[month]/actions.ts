"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/utils/supabase/server";

/**
 * Crea la nómina del periodo (si no existe) y te lleva al editor de ítems.
 * NO se llama automáticamente, solo cuando pulsas el botón.
 */
export async function startPayrollPeriod(formData: FormData) {
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    throw new Error("Parámetros inválidos");
  }

  const s = createSupabaseServer();

  // Cambia el nombre del RPC si el tuyo es diferente
  const { error } = await s.rpc("payroll_generate_period", {
    p_year: year,
    p_month: month,
  });

  if (error) {
    // Opcional: puedes loguear el error o mostrar un aviso en cliente
    throw new Error(error.message);
  }

  // Te lleva al editor de ítems del periodo
  redirect(`/payroll/period/${year}/${month}`);
}
