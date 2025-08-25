import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export async function GET(req: Request) {
  await requireUser();
  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));
  if (!year || !month) return NextResponse.json({ error: "year & month required" }, { status: 400 });

  // ejemplo: para CRA exportamos conceptos de devengo cotizable
  const { data: prs } = await supabase
    .from("payrolls")
    .select("id, employee_id, employees:employee_id(full_name, national_id)")
    .eq("period_year", year)
    .eq("period_month", month);

  const ids = (prs ?? []).map(p=>p.id);
  let csv = "NIF;NOMBRE;COD_CONCEPTO;IMPORTE\n";

  if (ids.length) {
    const { data: lines } = await supabase
      .from("payroll_lines")
      .select("*, payrolls:payroll_id(employee_id)")
      .in("payroll_id", ids)
      .eq("base_cc", true); // cotizable

    for (const l of (lines ?? [])) {
      const pr = (prs ?? []).find(p=>p.id === l.payroll_id);
      const nif = pr?.employees?.national_id || "";
      const name = pr?.employees?.full_name || "";
      const code = l.concept_code || "COT";
      const amt = (l.amount || 0) > 0 ? l.amount : 0;
      csv += `${nif};${name};${code};${amt.toFixed(2)}\n`;
    }
  }

  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8" } });
}
