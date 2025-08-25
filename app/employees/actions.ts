export async function setEmployeeDepartment(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const user = await requireUser();

  const employeeId = String(formData.get("employee_id") ?? "");
  const departmentId = String(formData.get("department_id") ?? "") || null;

  if (!employeeId) return;

  // ✅ reclamamos la fila si no tenía user_id y guardamos el depto
  const { error } = await supabase
    .from("employees")
    .update({
      department_id: departmentId || null,
      user_id: user.id, // si era NULL, ahora pasa a ser tuya
    })
    .eq("id", employeeId); // RLS evitará tocar filas de otros usuarios

  if (error) throw new Error(error.message);

  revalidatePath("/employees");
}
