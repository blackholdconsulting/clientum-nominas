import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { pdf } from "@react-pdf/renderer";
import ReceiptPDF, { ReceiptData } from "@/lib/pdf/payroll/Receipt";

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
    const { payrollId, employeeId } = await req.json();
    if (!payrollId || !employeeId) {
      return NextResponse.json({ ok: false, error: "Faltan payrollId y employeeId" }, { status: 400 });
    }

    const supabase = supabaseServer();

    // Periodo
    const { data: p, error: pErr } = await supabase.from("payrolls").select("*").eq("id", payrollId).single();
    if (pErr || !p) throw new Error(pErr?.message ?? "No existe el periodo.");

    // Empleado
    const { data: e, error: eErr } = await supabase.from("employees").select("*").eq("id", employeeId).single();
    if (eErr || !e) throw new Error(eErr?.message ?? "No existe el empleado.");

    // Items
    const { data: items, error: iErr } = await supabase
      .from("payroll_items").select("*").eq("payroll_id", payrollId).eq("employee_id", employeeId)
      .order("id", { ascending: true });
    if (iErr) throw new Error(iErr.message);

    // Org (opcional)
    let org: any = null;
    const orgColumn = "org_id" in p ? "org_id" : ("organization_id" in p ? "organization_id" : null);
    if (orgColumn && p[orgColumn]) {
      const { data: o } = await supabase.from("orgs").select("*").eq("id", p[orgColumn]).single();
      org = o ?? null;
    }

    // Cálculos
    const num = (x: any, d = 0) => {
      const v = typeof x === "string" ? x.replace(",", ".") : x;
      const n = Number(v);
      return Number.isFinite(n) ? n : d;
    };
    const earnings = (items ?? []).filter((it: any) => (it.type ?? "").toLowerCase() === "earning");
    const deductions = (items ?? []).filter((it: any) => (it.type ?? "").toLowerCase() === "deduction");

    const totalDevengos = earnings.reduce((a: number, it: any) => a + num(it.amount), 0);
    const totalDeduccionesManuales = deductions.reduce((a: number, it: any) => a + num(it.amount), 0);

    const baseCotizacion = (items ?? []).filter((it: any) => (it.cotizable ?? true)).reduce((a: number, it: any) => a + num(it.amount), 0);
    const baseIRPF      = (items ?? []).filter((it: any) => (it.sujeto_irpf ?? true)).reduce((a: number, it: any) => a + num(it.amount), 0);

    const pctIRPF  = num(p.irpf_pct ?? e.irpf_pct, 0);
    const pctSSTrb = num(p.ss_emp_pct ?? e.ss_emp_pct, 0);
    const pctSSEmp = num(e.ss_er_pct, 29.9);

    const ssTrab = (baseCotizacion * pctSSTrb) / 100;
    const irpf   = (baseIRPF * pctIRPF) / 100;
    const totalDeducciones = totalDeduccionesManuales + ssTrab + irpf;
    const neto   = totalDevengos - totalDeducciones;
    const ssEmp  = (baseCotizacion * pctSSEmp) / 100;

    const employeeName =
      (e.full_name ?? [e.first_name, e.last_name].filter(Boolean).join(" ")) || "Empleado";

    const data: ReceiptData = {
      company: { name: org?.name ?? "Empresa", cif: org?.cif ?? org?.nif ?? "—", address: org?.address ?? "—", ccc: org?.ccc ?? "—" },
      employee: { name: employeeName, nif: e.national_id ?? e.nif ?? "—", ssn: e.ssn ?? "—", job_title: e.job_title ?? e.position ?? "—", iban: e.iban ?? "—" },
      period: { year: p.year, month: p.month, days: p.days_in_period ?? null },
      items: (items ?? []).map((it: any) => ({ concept: it.concept ?? it.description ?? "Concepto", amount: num(it.amount, 0), type: (it.type ?? "earning") })),
      bases: { cotizacion: baseCotizacion, irpf: baseIRPF },
      contribEmployee: { ss: ssTrab, pctSS: pctSSTrb, irpf, pctIRPF, total: ssTrab + irpf },
      contribEmployer: { ss: ssEmp, pctSS: pctSSEmp },
      totals: { devengos: totalDevengos, deducciones: totalDeducciones, neto },
    };

    // Renderizar PDF (JSX => requiere .tsx)
    const buffer = await pdf(<ReceiptPDF {...data} />).toBuffer();

    // Subida a Storage
    const bucket = "nominas";
    const y  = String(p.year);
    const mm = String(p.month).padStart(2, "0");
    const path = `${org?.id ?? "org"}/${y}-${mm}/${employeeId}.pdf`;

    const { error: upErr } = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (upErr) throw new Error("Error subiendo PDF: " + upErr.message);

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ ok: true, path, url: pub?.publicUrl ?? null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}
