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

async function findExistingPeriod(
  supabase: ReturnType<typeof supabaseServer>,
  year: number,
  month: number
) {
  // Intento 1: year/month
  let r = await supabase
    .from("payrolls")
    .select("id")
    .eq("year", year)
    .eq("month", month)
    .limit(1);
  if (!r.error && (r.data ?? []).length) return r.data![0];

  // Intento 2: period_year/period_month
  r = await supabase
    .from("payrolls")
    .select("id")
    .eq("period_year", year)
    .eq("period_month", month)
    .limit(1);
  if (!r.error && (r.data ?? []).length) return r.data![0];

  return null;
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
    const existing = await findExistingPeriod(supabase, year, month);
    if (existing) {
      return NextResponse.json({ ok: true, id: existing.id, created: false });
    }

    // Leer posibles membresías (no bloquea si falla)
    let orgIds: string[] = [];
    const { data: memberships } = await supabase.from("org_members").select("org_id").limit(20);
    if (memberships?.length) orgIds = Array.from(new Set(memberships.map((m: any) => m.org_id).filter(Boolean)));

    // Resolver orgId si no viene
    if (!orgId) {
      if (orgIds.length === 1) orgId = orgIds[0];
      else if (orgIds.length > 1) {
        // devolver la lista para que el cliente pida elección
        let orgs = orgIds.map((id) => ({ id, name: id }));
        const { data: named } = await supabase.from("orgs").select("id,name").in("id", orgIds);
        if (named?.length) {
          const map = new Map(named.map((r: any) => [r.id, r.name || r.id]));
          orgs = orgIds.map((id) => ({ id, name: (map.get(id) as string) ?? id }));
        }
        return NextResponse.json({ ok: false, code: "MULTI_ORG", orgs }, { status: 409 });
      }
      // Si no hay orgs, probaremos a crear sin org_* (según tu esquema/RLS)
    }

    // === Inserción flexible ===
    // Intento A: columnas year/month (+ org_id u organization_id)
    let payload: any = { year, month, status: "draft" as const };
    if (orgId) payload.org_id = orgId;

    let ins = await supabase.from("payrolls").insert(payload).select("id").single();

    // Si falla por org_id (col no existe), reintenta con organization_id
    if (ins.error && /column .*org_id.* does not exist/i.test(ins.error.message)) {
      const p = { ...payload };
      delete p.org_id;
      if (orgId) (p as any).organization_id = orgId;
      ins = await supabase.from("payrolls").insert(p).select("id").single();
    }

    // Si falla por columnas year/month ausentes o NOT NULL de period_year → reintento B
    if (
      ins.error &&
      (/column .*year.* does not exist/i.test(ins.error.message) ||
        /period_year/.test(ins.error.message) ||
        /period_month/.test(ins.error.message))
    ) {
      let p2: any = { period_year: year, period_month: month, status: "draft" as const };
      if (orgId) p2.org_id = orgId;
      let ins2 = await supabase.from("payrolls").insert(p2).select("id").single();
      if (ins2.error && /column .*org_id.* does not exist/i.test(ins2.error.message)) {
        const p3 = { ...p2 };
        delete p3.org_id;
        (p3 as any).organization_id = orgId;
        ins2 = await supabase.from("payrolls").insert(p3).select("id").single();
      }
      if (ins2.error) {
        return NextResponse.json({ ok: false, error: ins2.error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, id: ins2.data?.id, created: true });
    }

    if (ins.error) {
      return NextResponse.json({ ok: false, error: ins.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: ins.data?.id, created: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}
