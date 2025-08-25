import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export async function GET(req: Request) {
  await requireUser();
  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const quarter = Number(searchParams.get("quarter")); // 1..4

  if (!year || !quarter) {
    return NextResponse.json({ error: "year & quarter required" }, { status: 400 });
  }

  const monthsByQ = {1:[1,2,3], 2:[4,5,6], 3:[7,8,9], 4:[10,11,12]} as const;
  const months = (monthsByQ as any)[quarter] as number[];

  // suma retenciones = IRPF calculado en nóminas de esos meses
  const { data } = await supabase
    .from("payrolls")
    .select("base_irpf, irpf_pct")
    .eq("period_year", year)
    .in("period_month", months);

  const base = (data ?? []).reduce((a,p)=>a + (p.base_irpf||0), 0);
  const ret = (data ?? []).reduce((a,p)=>a + ((p.base_irpf||0)*(p.irpf_pct||0)/100), 0);

  // TXT plano (puedes adaptar al layout exacto de la AEAT si lo necesitas)
  const txt = [
    `MODELO:111`,
    `EJERCICIO:${year}`,
    `PERIODO:T${quarter}`,
    `BASE:${base.toFixed(2)}`,
    `RETENCION:${ret.toFixed(2)}`
  ].join("\n");

  return new NextResponse(txt, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
