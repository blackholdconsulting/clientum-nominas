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

    // Idempotencia: ¿existe ya?
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

    // Resolver organización
    const { data: memberships, error: memErr } = await supabase
      .from("org_members")
      .select("org_id")
      .limit(20);
    if (memErr) throw new Error(memErr.message);

    const ids = Array.from(
      new Set((memberships ?? []).map((m: any) => m.org_id).filter(Boolean))
    );

    if (!orgId) {
      if (ids.length === 1) {
        orgId = ids[0];
      } else if (ids.length > 1) {
        // Devolver lista de organizaciones para que el cliente muestre modal
        let orgs = ids.map((id) => ({ id, name: id }));
        const { data: named } = await supabase
          .from("orgs")
          .select("id,name")
          .in("id", ids);
        if (named && named.length) {
          const map = new Map(named.map((r: any) => [r.id, r.name || r.id]));
          orgs = ids.map((id) => ({ id, name: (map.get(id) as string) ?? id }));
        }
        return NextResponse.json(
          { ok: false, code: "MULTI_ORG", orgs },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { ok: false, error: "El usuario no pertenece a ninguna organización." },
          { status: 403 }
        );
      }
    }

    // Insertar período
    let payload: any = { year, month, status: "draft" as const, org_id: orgId };
    let ins = await supabase.from("payrolls").insert(payload).select("id").single();

    // Compat: organization_id si org_id no existe
    if (ins.error && /column .*org_id.* does not exist/i.test(ins.error.message)) {
      payload = { year, month, status: "draft" as const, organization_id: orgId };
      ins = await supabase.from("payrolls").insert(payload).select("id").single();
    }
    if (ins.error) throw new Error(ins.error.message);

    return NextResponse.json({ ok: true, id: ins.data?.id, created: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}
