import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // usa la service role (solo en server)
const supabase = createClient(supabaseUrl, serviceKey)

export async function POST(req: NextRequest) {
  try {
    const { html, key, employeeId, metadata } = await req.json()

    if (!html || !key || !employeeId) {
      return NextResponse.json({ error: "Missing html/key/employeeId" }, { status: 400 })
    }

    // 1) quién es el usuario (según tu auth)
    // si usas supabase-auth-helpers con cookies, puedes pasar user_id en metadata para simplificar
    const userId = metadata?.user_id
    if (!userId) {
      return NextResponse.json({ error: "Missing user_id in metadata" }, { status: 401 })
    }

    // 2) path del borrador en Storage
    const filename = `${key}-${Date.now()}.html`
    const path = `${userId}/${employeeId}/${filename}`

    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(path, new Blob([html], { type: "text/html" }), { upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage.from("contracts").getPublicUrl(path)

    // 3) inserta/actualiza fila del contrato (simplificado)
    // Nota: puedes buscar si ya existe un contrato para employeeId y key y hacer upsert
    const { error: dbError } = await supabase
      .from("contracts")
      .insert({
        user_id: userId,
        employee_id: employeeId,
        template: key,
        title: `${key} - ${metadata?.employee_name ?? ""}`,
        data: metadata?.data ?? {},
        status: "borrador",
        html_path: path,
        pdf_url: null,
      })
      .select()
      .single()

    if (dbError) {
      // si ya existía, actualiza el html_path
      const { error: updErr } = await supabase
        .from("contracts")
        .update({ html_path: path, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("employee_id", employeeId)
        .eq("template", key)

      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      ok: true,
      path,
      publicUrl: publicUrlData?.publicUrl ?? null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 })
  }
}
