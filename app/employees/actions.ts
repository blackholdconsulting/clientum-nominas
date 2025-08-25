"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

const toStr = (x: FormDataEntryValue | null) =>
  (typeof x === "string" ? x.trim() : "") || null;

export async function createEmployee(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const user = await requireUser();

  // --- Personales
  const first_name = toStr(formData.get("first_name"));
  const last_name = toStr(formData.get("last_name"));
  const full_name = toStr(formData.get("full_name")) || [first_name, last_name].filter(Boolean).join(" ").trim() || null;
  const email = toStr(formData.get("email"));
  const phone = toStr(formData.get("phone"));
  const national_id = toStr(formData.get("national_id"));
  const address_line = toStr(formData.get("address_line"));
  const city = toStr(formData.get("city"));
  const postal_code = toStr(formData.get("postal_code"));
  const birth_date = toStr(formData.get("birth_date")); // YYYY-MM-DD

  // --- Laborales
  const department_id = toStr(formData.get("department_id"));
  const job_title = toStr(formData.get("job_title"));
  const contract_type = toStr(formData.get("contract_type"));
  const start_date = toStr(formData.get("start_date"));
  const weekly_hours = (() => {
    const v = toStr(formData.get("weekly_hours"));
    return v ? Number(v) : null;
  })();
  const annual_salary_eur = (() => {
    const v = toStr(formData.get("annual_salary_eur"));
    return v ? Number(v.replace(",", ".")) : null;
  })();

  // --- Adicional
  const iban = toStr(formData.get("iban"));
  const ssn = toStr(formData.get("ssn"));
  const notes = toStr(formData.get("notes"));

  if (!full_name && !first_name)
    throw new Error("El nombre es obligatorio.");

  // position (compat) = job_title
  const { error } = await supabase.from("employees").insert({
    user_id: user.id,
    first_name,
    last_name,
    full_name,
    email,
    phone,
    national_id,
    address_line,
    city,
    postal_code,
    birth_date,
    department_id: department_id || null,
    job_title,
    position: job_title,
    contract_type,
    start_date,
    weekly_hours,
    annual_salary_eur,
    iban,
    ssn,
    notes,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/employees");
  redirect("/employees");
}
