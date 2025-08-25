import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export async function GET(req: Request) {
  await requireUser();
  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  if (!year) return NextResponse.json({ error: "year required" }, { status: 400 });

  const { data } = await supabase
    .from("payrolls")
    .select("employee_id, base_irpf, irpf_pct, employees:employee_id(full_name, national_id)")
    .eq("period_year", year);

  const map = new Map<string, { name:string; nif:string; base:number; ret:number }>();
  (data ?? []).forEach(p=>{
    const key = p.employee_id;
    const base = p.base_irpf || 0;
    const ret = (p.base_irpf||0) * (p.irpf_pct||0) / 100;
    const prev = map.get(key) || { name: p.employees?.full_name || "", nif: p.employees?.national_id || "", base:0, ret:0 };
    prev.base += base; prev.ret += ret; map.set(key, prev);
  });

  let csv = "NIF;NOMBRE;BASE;RETENCION\n";
  for (const [,v] of map) csv += `${v.nif};${v.name};${v.base.toFixed(2)};${v.ret.toFixed(2)}\n`;

  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8" } });
}
