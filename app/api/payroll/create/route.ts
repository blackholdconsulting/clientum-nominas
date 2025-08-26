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

    // ¿ya existe?
    const { data: existing, error: exErr } = await supabase
      .from("payrolls")
      .select("id")
      .eq("year", year)
      .eq("month", month)
      .limit(1);
    if (exErr) throw new Error(exErr.message);
    if (existing && existing.length > 0) {
      return NextResponse.json({ ok: true, id: existing[0].id, created: false });
    }

    // org_id (si user tiene una única org, úsala)
    let orgId = providedOrgId;
    if (!orgId) {
      const { data: memberships, error: memErr } = await supabase
        .from("org_members")
        .select("org_id")
        .limit(2);
      if (memErr) throw new Error(memErr.message);
      if ((memberships ?? []).length === 1) orgId = memberships![0].org_id as string;
      if (!orgId && (memberships ?? []).length !== 1) {
        return NextResponse.json({ ok: false, error: "Varias organizaciones: proporciona orgId." }, { status: 400 });
      }
    }

    // Inserta con org_id; si no existe la columna, reintenta con organization_id
    let payload: any = { year, month, status: "draft" as const };
    if (orgId) payload.org_id = orgId;

    let ins = await supabase.from("payrolls").insert(payload).select("id").single();
    if (ins.error && /column .*org_id.* does not exist/i.test(ins.error.message)) {
      payload = { year, month, status: "draft" as const };
      if (orgId) (payload as any).organization_id = orgId;
      ins = await supabase.from("payrolls").insert(payload).select("id").single();
    }
    if (ins.error) throw new Error(ins.error.message);

    return NextResponse.json({ ok: true, id: ins.data?.id, created: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}
