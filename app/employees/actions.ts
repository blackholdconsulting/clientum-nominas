"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function setEmployeeDepartment(formData: FormData) {
  const supabase = getSupabaseServerClient();

  const employeeId = String(formData.get("employee_id") ?? "");
  const departmentId = String(formData.get("department_id") ?? "") || null;

  if (!employeeId) return;

  const { error } = await supabase
    .from("employees")
    .update({ department_id: departmentId || null })
    .eq("id", employeeId);

  if (error) {
    console.error("setEmployeeDepartment error:", error.message);
    throw new Error(error.message);
  }

  revalidatePath("/employees");
}
