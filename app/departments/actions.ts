"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createDepartment(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) return;

  const slug = slugify(name);
  const { error } = await supabase.from("departments").insert({
    name,
    slug,
    description: description || null,
  });

  if (error) {
    console.error("createDepartment error:", error.message);
    throw new Error(error.message);
  }

  revalidatePath("/departments");
}

export async function deleteDepartment(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Nota: si hay empleados asignados, el FK los deja en NULL (ON DELETE SET NULL)
  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) {
    console.error("deleteDepartment error:", error.message);
    throw new Error(error.message);
  }

  revalidatePath("/departments");
}
