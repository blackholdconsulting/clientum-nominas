"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// ---------- Esquemas de validación ----------
const accountSchema = z.object({
  full_name: z.string().min(2, "El nombre es demasiado corto"),
  email: z.string().email("Email inválido"),
});

const companySchema = z.object({
  company_name: z.string().min(2, "La razón social es requerida"),
  company_cif: z.string().min(3, "CIF inválido"),
});

// ---------- Update de perfil (profiles) ----------
export async function updateAccount(formData: FormData) {
  const supabase = getSupabaseServerClient();

  // 1) Usuario autenticado
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    throw new Error("No hay usuario autenticado");
  }

  // 2) Validación
  const parsed = accountSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(" · "));
  }
  const { full_name, email } = parsed.data;

  // 3) Actualizar tabla "profiles"
  //    Ajusta si tus columnas se llaman de otra forma
  const { error: upErr } = await supabase
    .from("profiles")
    .update({
      full_name,
      email,
    })
    .eq("id", user.id);

  if (upErr) throw new Error(upErr.message);

  revalidatePath("/settings");
  redirect("/settings?saved=account");
}

// ---------- Update / Upsert de empresa (companies) ----------
export async function updateCompany(formData: FormData) {
  const supabase = getSupabaseServerClient();

  // 1) Usuario autenticado
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    throw new Error("No hay usuario autenticado");
  }

  // 2) Validación
  const parsed = companySchema.safeParse({
    company_name: formData.get("company_name"),
    company_cif: formData.get("company_cif"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(" · "));
  }
  const { company_name, company_cif } = parsed.data;

  // 3) Upsert en tabla "companies"
  //    - Ajusta nombres si en tu BD son distintos (p. ej. "orgs", "cif", "owner_id")
  //    - Aquí asumo: { id, owner_id, name, cif }
  const { data: exists, error: exErr } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (exErr) throw new Error(exErr.message);

  if (exists?.id) {
    const { error: upErr } = await supabase
      .from("companies")
      .update({ name: company_name, cif: company_cif })
      .eq("id", exists.id);
    if (upErr) throw new Error(upErr.message);
  } else {
    const { error: insErr } = await supabase.from("companies").insert({
      owner_id: user.id,
      name: company_name,
      cif: company_cif,
    });
    if (insErr) throw new Error(insErr.message);
  }

  revalidatePath("/settings");
  redirect("/settings?saved=company");
}
