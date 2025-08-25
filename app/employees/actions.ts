"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/** Eliminar empleado por ID (forma correcta para usar con <form action={...}>) */
export async function deleteEmployee(id: string) {
  const supabase = getSupabaseServerClient();
  await requireUser();

  if (!id) throw new Error("ID requerido");

  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) throw new Error(error.message);

  // refresca el listado
  revalidatePath("/employees");
}

/* Deja aquí tus otras actions, por ejemplo:
export async function updateEmployee(formData: FormData) { ... }
export async function createEmployee(formData: FormData) { ... }
*/
