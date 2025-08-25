"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/utils/supabase/server";

/** DepartmentSelect espera este export */
export async function setEmployeeDepartment(employeeId: string, departmentId: string | null) {
  const s = createSupabaseServer();
  const { error } = await s
    .from("employees")
    .update({ department_id: departmentId })
    .eq("id", employeeId);
  if (error) throw error;
  revalidatePath("/employees");
}

/** Edit page usa updateEmployee; soporta FormData y objeto */
export async function updateEmployee(input: FormData | Record<string, any>) {
  const s = createSupabaseServer();
  const isFD = typeof (input as any).get === "function";
  const id = isFD ? String((input as FormData).get("id")) : String((input as any).id);
  const patch = isFD
    ? {
        full_name: (input as FormData).get("full_name"),
        email: (input as FormData).get("email"),
        base_gross: Number((input as FormData).get("base_gross") ?? 0),
        irpf_percent: Number((input as FormData).get("irpf_percent") ?? 15),
        department_id: (input as FormData).get("department_id"),
      }
    : (input as any);

  const { error } = await s.from("employees").update(patch).eq("id", id);
  if (error) throw error;
  revalidatePath("/employees");
  return { ok: true };
}
