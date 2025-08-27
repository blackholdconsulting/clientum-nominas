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
    let orgId: string | null = body?.orgId ?? null;

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ ok: false, error: "Parámetros inválidos (year/month)." }, { status: 400 });
    }

    const supabase = supabaseServer();

    // Idempotencia
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

    // Resolución de organización (si procede)
    const { data: memberships, error: memErr } = await supabase
      .from("org_members")
      .select("org_id")
      .limit(20);
    if (memErr) {
      // si falla la lectura por RLS o la tabla no existe, seguimos sin org
      // (permitimos crear sin org si el esquema lo admite)
    }

    const ids = Array.from(new Set((memberships ?? []).map((m: any) => m.org_id).filter(Boolean)));

    if (!orgId) {
      if (ids.length > 1) {
        // MULTI_ORG → que el cliente muestre modal
        let orgs = ids.map((id) => ({ id, name: id }));
        const { data: named } = await supabase
          .from("orgs")
          .select("id,name")
          .in("id", ids);
        if (named && named.length) {
          const map = new Map(named.map((r: any) => [r.id, r.name || r.id]));
          orgs = ids.map((id) => ({ id, name: (map.get(id) as string) ?? id }));
        }
        return NextResponse.json({ ok: false, code: "MULTI_ORG", orgs }, { status: 409 });
      }
      if (ids.length === 1) {
        orgId = ids[0];
      }
      // ids.length === 0 → no imponemos org: intentamos crear sin org
    }

    // Intento 1: con org_id si la tenemos
    let payload: any = { year, month, status: "draft" as const };
    if (orgId) payload.org_id = orgId;

    let ins = await supabase.from("payrolls").insert(payload).select("id").single();

    // Compatibilidad: usar organization_id si org_id no existe
    if (ins.error && /column .*org_id.* does not exist/i.test(ins.error.message)) {
      payload = { year, month, status: "draft" as const };
      if (orgId) (payload as any).organization_id = orgId;
      ins = await supabase.from("payrolls").insert(payload).select("id").single();
    }

    // Si intentábamos sin org y el esquema exige org (NOT NULL) o RLS bloquea
    if (ins.error) {
      const msg = ins.error.message.toLowerCase();
      if (msg.includes("not-null constraint") && msg.includes("org")) {
        return NextResponse.json(
          { ok: false, code: "ORG_REQUIRED", error: "Esta instalación requiere organización para crear nóminas." },
          { status: 409 }
        );
      }
      if (msg.includes("row-level security")) {
        return NextResponse.json(
          { ok: false, code: "RLS_BLOCKED", error: "Las políticas RLS impiden crear la nómina sin organización." },
          { status: 403 }
        );
      }
      // Otro error
      return NextResponse.json({ ok: false, error: ins.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: ins.data?.id, created: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}
