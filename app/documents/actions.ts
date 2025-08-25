"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

/**
 * Sube 1..N ficheros al bucket `documents` y crea su fila en la tabla `documents`.
 * Acepta `<input type="file" name="files" multiple>`
 */
export async function uploadDocuments(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const user = await requireUser();

  // Busca la empresa del usuario (si existe) para asociar company_id
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  const files = formData.getAll("files").filter(Boolean) as File[];
  if (!files.length) return;

  for (const f of files) {
    const path = `${user.id}/${Date.now()}_${f.name}`.replace(/\s+/g, "_");

    const { error: uploadErr } = await supabase.storage
      .from("documents")
      .upload(path, f, {
        contentType: f.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadErr) {
      console.error("Upload error:", uploadErr.message);
      continue;
    }

    // Metadatos
    const { error: insErr } = await supabase.from("documents").insert({
      user_id: user.id,
      company_id: company?.id ?? null,
      name: f.name,
      path,
      size: (f as any).size ?? null,
      content_type: (f as any).type ?? null,
    });
    if (insErr) console.error("Insert documents error:", insErr.message);

    // Log
    await supabase.from("activity_log").insert({
      user_id: user.id,
      company_id: company?.id ?? null,
      action: "upload_document",
      meta: { name: f.name, path },
    });
  }

  revalidatePath("/documents");
}

/** Elimina un documento (registro + fichero en Storage) */
export async function deleteDocument(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const user = await requireUser();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { data: doc, error } = await supabase
    .from("documents")
    .select("id, path, company_id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !doc) {
    console.error("Document not found or not owned");
    return;
  }

  const { error: rmErr } = await supabase.storage
    .from("documents")
    .remove([doc.path]);
  if (rmErr) console.error("Storage remove error:", rmErr.message);

  const { error: delErr } = await supabase
    .from("documents")
    .delete()
    .eq("id", doc.id);
  if (delErr) console.error("DB delete error:", delErr.message);

  await supabase.from("activity_log").insert({
    user_id: user.id,
    company_id: doc.company_id ?? null,
    action: "delete_document",
    meta: { id: doc.id, name: doc.name, path: doc.path },
  });

  revalidatePath("/documents");
}
