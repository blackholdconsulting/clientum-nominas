// app/payroll/period/[year]/[month]/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/utils/supabase/server"; // <-- usa tu helper real

export async function createDraftPayroll(formData: FormData) {
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));

  if (!year || !month) {
    throw new Error("Periodo inválido.");
  }

  const supabase = createSupabaseServer();

  // Usuario
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    throw new Error("Sesión no válida.");
  }

  // Crea o recupera si ya existe (evita duplicados)
  const { data, error } = await supabase
    .from("payrolls")
    .upsert(
      {
        user_id: user.id,
        period_year: year,
        period_month: month,
        status: "draft", // estado inicial
      },
      {
        onConflict: "user_id,period_year,period_month",
        ignoreDuplicates: false,
      }
    )
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo crear la nómina: " + error.message);
  }

  // Opcional: podrías inicializar aquí items/empleados si lo deseas

  // Refresca y vuelve al editor del periodo
  revalidatePath(`/payroll/period/${year}/${month}`);
  redirect(`/payroll/period/${year}/${month}`);
}
