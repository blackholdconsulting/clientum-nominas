"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createOrg(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = getSupabaseServerClient();
  const user = await requireUser();

  const slug = slugify(name);
  const { error } = await supabase.from("orgs").insert({
    name,
    slug,
    user_id: user.id,
  });

  if (error) {
    console.error("createOrg error:", error.message);
    throw new Error(error.message);
  }

  revalidatePath("/org/select");
}
