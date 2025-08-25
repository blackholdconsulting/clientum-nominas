"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

/** Crear empleado */
export async function createEmployee(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const user = await requireUser();

  const full_name = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const position = String(formData.get("position") || "").trim() || null;
  const department_id = String(formData.get("department_id") || "") || null;

  if (!full_name) throw new Error("El nombre es obligatorio.");

  const { error } = await supabase.from("employees").insert({
    user_id: user.id,
    full_name,
    email,
    phone,
    position,
    department_id: department_id || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/employees");
  redirect("/employees");
}

/** Actualizar empleado */
export async function updateEmployee(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const user = await requireUser();

  const id = String(formData.get("id") || "");
  const full_name = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const position = String(formData.get("position") || "").trim() || null;
  const department_id = String(formData.get("department_id") || "") || null;

  if (!id) throw new Error("ID inválido.");
  if (!full_name) throw new Error("El nombre es obligatorio.");

  const { error } = await supabase
    .from("employees")
    .update({
      full_name,
      email,
      phone,
      position,
      department_id: department_id || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/employees");
  redirect("/employees");
}

/** Eliminar empleado */
export async function deleteEmployee(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const user = await requireUser();

  const id = String(formData.get("employee_id") || "");
  if (!id) return;

  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/employees");
}

/** Asignar departamento */
export async function setEmployeeDepartment(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const user = await requireUser();

  const employeeId = String(formData.get("employee_id") ?? "");
  const departmentId = String(formData.get("department_id") ?? "") || null;

  if (!employeeId) return;

  const { error } = await supabase
    .from("employees")
    .update({ department_id: departmentId || null })
    .eq("id", employeeId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/employees");
}
