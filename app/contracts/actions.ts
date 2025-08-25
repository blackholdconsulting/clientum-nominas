"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export async function createContract(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const user = await requireUser();

  const employee_id = String(formData.get("employee_id") || "");
  const contract_type = String(formData.get("contract_type") || "Indefinido");
  const start_date_raw = String(formData.get("start_date") || "");
  const start_date = start_date_raw || null;

  if (!employee_id) throw new Error("Selecciona un empleado.");

  // Validar que el empleado pertenece al usuario
  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("id", employee_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!emp) throw new Error("Ese empleado no pertenece a tu cuenta.");

  const { error } = await supabase.from("contracts").insert({
    user_id: user.id,
    employee_id,
    contract_type,
    start_date,
    status: "draft",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/contracts");
  redirect("/contracts");
}
