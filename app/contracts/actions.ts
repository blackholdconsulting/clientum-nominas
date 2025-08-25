"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function createContract(formData: FormData) {
  const supabase = getSupabaseServerClient();

  const employee_id = String(formData.get("employee_id") || "");
  const contract_type = String(formData.get("contract_type") || "Indefinido");
  const start_date_raw = String(formData.get("start_date") || "");
  const start_date = start_date_raw ? start_date_raw : null; // formato YYYY-MM-DD

  if (!employee_id) {
    throw new Error("Selecciona un empleado antes de crear el contrato.");
  }

  const { error } = await supabase.from("contracts").insert({
    employee_id,
    contract_type,
    start_date,        // date (nullable)
    status: "draft",   // estado inicial
  });

  if (error) {
    console.error("createContract error:", error.message);
    throw new Error(error.message);
  }

  revalidatePath("/contracts");
  redirect("/contracts"); // si tienes detalle, cámbialo a `/contracts/[id]`
}
