import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const year = Number(body?.year);
    const month = Number(body?.month);
    const providedOrgId: string | null = body?.orgId ?? null;
    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ ok: false, error: "Parámetros inválidos (year/month)." }, { status: 400 });
    }

    const supabase = supabaseServer();

    // Si ya existe, devolver OK con id
    const { data: existing } = await supabase
      .from("payrolls")
      .select("id, year, month")
      .eq("year", year)
      .eq("month", month)
      .limit(1);
    if (existing && existing.length > 0) {
      return NextResponse.json({ ok: true, id: existing[0].id, created: false });
    }

    // Determinar org_id si no viene
    let orgId = providedOrgId;
    if (!orgId) {
      const { data: memberships, error: memErr } = await supabase
        .from("org_members")
        .select("org_id")
        .limit(2);
      if (memErr) throw new Error(memErr.message);
      if ((memberships ?? []).length === 1) {
        orgId = memberships![0].org_id as string;
      } else {
        // si múltiples organizaciones, requiere orgId explícito
        if (!orgId) {
          return NextResponse.json({ ok: false, error: "Varias organizaciones: proporciona orgId." }, { status: 400 });
        }
      }
    }

    // Inserción (intenta con org_id y si no existe la columna, reintenta con organization_id)
    let insertPayload: any = { year, month, status: "draft" as const };
    if (orgId) insertPayload.org_id = orgId;

    let ins = await supabase.from("payrolls").insert(insertPayload).select("*").single();
    if (ins.error && /column .*org_id.* does not exist/i.test(ins.error.message)) {
      // reintentar con organization_id
      insertPayload = { year, month, status: "draft" as const };
      if (orgId) (insertPayload as any).organization_id = orgId;
      ins = await supabase.from("payrolls").insert(insertPayload).select("*").single();
    }
    if (ins.error) throw new Error(ins.error.message);

    return NextResponse.json({ ok: true, id: ins.data?.id, created: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}
