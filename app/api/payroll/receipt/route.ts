import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { pdf } from "@react-pdf/renderer";
import React from "react"; // 👈 necesario para createElement
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

    // 1) Periodo
    const { data: p, error: pErr } = await supabase
      .from("payrolls")
      .select("*")
      .eq("id", payrollId)
      .single();
    if (pErr || !p) throw new Error(pErr?.message ?? "No existe el periodo.");

    // 2) Empleado
    const { data: e, error: eErr } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .single();
    if (eErr || !e) throw new Error(eErr?.message ?? "No existe el empleado.");

    // 3) Items
    const { data: items, error: iErr } = await supabase
      .from("payroll_items")
      .select("*")
      .eq("payroll_id", payrollId)
      .eq("employee_id", employeeId)
      .order("id", { ascending: true });
    if (iErr) throw new Error(iErr.message);

    // 4) Organización (opcional)
    let org: any = null;
    const orgColumn = "org_id" in p ? "org_id" : ("organization_id" in p ? "organization_id" : null);
    if (orgColumn && (p as any)[orgColumn]) {
      const { data: o } = await supabase.from("orgs").select("*").eq("id", (p as any)[orgColumn]).single();
      org = o ?? null;
    }

    // 5) Cálculos
    const num = (x: any, d = 0) => {
      const v = typeof x === "string" ? x.replace(",", ".") : x;
      const n = Number(v);
      return Number.isFinite(n) ? n : d;
    };

    const earnings = (items ?? []).filter((it: any) => (it.type ?? "").toLowerCase() === "earning");
    const deductions = (items ?? []).filter((it: any) => (it.type ?? "").toLowerCase() === "deduction");

    const totalDevengos = earnings.reduce((a: number, it: any) => a + num(it.amount), 0);
    const totalDeduccionesManuales = deductions.reduce((a: number, it: any) => a + num(it.amount), 0);

    const baseCotizacion = (items ?? [])
      .filter((it: any) => (it.cotizable ?? true))
      .reduce((a: number, it: any) => a + num(it.amount), 0);

    const baseIRPF = (items ?? [])
      .filter((it: any) => (it.sujeto_irpf ?? true))
      .reduce((a: number, it: any) => a + num(it.amount), 0);

    const pctIRPF  = num((p as any).irpf_pct ?? (e as any).irpf_pct, 0);
    const pctSSTrb = num((p as any).ss_emp_pct ?? (e as any).ss_emp_pct, 0);
    const pctSSEmp = num((e as any).ss_er_pct, 29.9);

    const ssTrab = (baseCotizacion * pctSSTrb) / 100;
    const irpf   = (baseIRPF * pctIRPF) / 100;
    const totalDeducciones = totalDeduccionesManuales + ssTrab + irpf;
    const neto   = totalDevengos - totalDeducciones;
    const ssEmp  = (baseCotizacion * pctSSEmp) / 100;

    const employeeName =
      ((e as any).full_name ?? [(e as any).first_name, (e as any).last_name].filter(Boolean).join(" ")) || "Empleado";

    const data: ReceiptData = {
      company: {
        name: org?.name ?? "Empresa",
        cif: org?.cif ?? org?.nif ?? "—",
        address: org?.address ?? "—",
        ccc: org?.ccc ?? "—",
      },
      employee: {
        name: employeeName,
        nif: (e as any).national_id ?? (e as any).nif ?? "—",
        ssn: (e as any).ssn ?? "—",
        job_title: (e as any).job_title ?? (e as any).position ?? "—",
        iban: (e as any).iban ?? "—",
      },
      period: {
        year: (p as any).year,
        month: (p as any).month,
        days: (p as any).days_in_period ?? null,
      },
      items: (items ?? []).map((it: any) => ({
        concept: it.concept ?? it.description ?? "Concepto",
        amount: num(it.amount, 0),
        type: (it.type ?? "earning") as "earning" | "deduction",
      })),
      bases: {
        cotizacion: baseCotizacion,
        irpf: baseIRPF,
      },
      contribEmployee: {
        ss: ssTrab,
        pctSS: pctSSTrb,
        irpf,
        pctIRPF,
        total: ssTrab + irpf,
      },
      contribEmployer: {
        ss: ssEmp,
        pctSS: pctSSEmp,
      },
      totals: {
        devengos: totalDevengos,
        deducciones: totalDeducciones,
        neto,
      },
    };

    // 6) Renderizar PDF SIN JSX (compatible con .ts)
    const buffer = await pdf(React.createElement(ReceiptPDF, data as any)).toBuffer();

    // 7) Subir a Storage
    const bucket = "nominas";
    const y  = String((p as any).year);
    const mm = String((p as any).month).padStart(2, "0");
    const path = `${org?.id ?? "org"}/${y}-${mm}/${employeeId}.pdf`;

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType: "application/pdf", upsert: true });
    if (upErr) throw new Error("Error subiendo PDF: " + upErr.message);

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ ok: true, path, url: pub?.publicUrl ?? null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}
