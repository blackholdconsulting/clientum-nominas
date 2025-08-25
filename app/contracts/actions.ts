"use server";
import { createSupabaseServer } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Mínimo viable para que compile y funcione:
 * Crea un contrato a partir de una plantilla (id: templateId)
 * en la tabla 'contracts' con campos básicos.
 */
export async function createContractFromTemplate(templateId: string, payload?: Record<string, any>) {
  const s = createSupabaseServer();

  // Lee plantilla (si existe)
  const tpl = await s.from("contract_templates").select("*").eq("id", templateId).maybeSingle();

  const insert = {
    template_id: templateId,
    title: payload?.title ?? tpl.data?.title ?? "Contrato",
    content: payload?.content ?? tpl.data?.content ?? "",
    status: payload?.status ?? "draft",
  };

  const { data, error } = await s.from("contracts").insert(insert).select("id").single();
  if (error) throw error;

  revalidatePath("/contracts");
  return data.id as string;
}
