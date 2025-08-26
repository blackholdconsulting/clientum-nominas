import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import crypto from "node:crypto";
import ReceiptPDF, { ReceiptData } from "@/lib/pdf/payroll/Receipt";
import { compute } from "@/lib/payroll/calc";

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
      .from("payroll_items")
      .select("*")
      .eq("payroll_id", payrollId)
      .eq("employee_id", employeeId)
      .order("id", { ascending: true });
    if (iErr) throw new Error(iErr.message);

    // Org (si la guardas en payrolls como org_id / organization_id)
    const orgColumn = "org_id" in p ? "org_id" : ("organization_id" in p ? "organization_id" : null);
    const orgId = orgColumn ? (p as any)[orgColumn] : null;

    // Cálculos (compartidos)
    const pctIRPF = Number((p as any).irpf_pct ?? (e as any).irpf_pct ?? 0);
    const pctSSTrb = Number((p as any).ss_emp_pct ?? (e as any).ss_emp_pct ?? 0);
    const pctSSEmp = Number((e as any).ss_er_pct ?? 0);

    const totals = compute({
      items: (items ?? []) as any,
      pctIrpf: pctIRPF,
      pctSsEmp: pctSSTrb,
      pctSsEr: pctSSEmp,
    });

    const employeeName =
      ((e as any).full_name ?? [(e as any).first_name, (e as any).last_name].filter(Boolean).join(" ")) || "Empleado";

    // (opcional) datos de org si existe
    let org: any = null;
    if (orgId) {
      const { data: o } = await supabase.from("orgs").select("*").eq("id", orgId).single();
      org = o ?? null;
    }

    // Datos para PDF
    const data: ReceiptData = {
      company: { name: org?.name ?? "Empresa", cif: org?.cif ?? org?.nif ?? "—", address: org?.address ?? "—", ccc: org?.ccc ?? "—" },
      employee: { name: employeeName, nif: (e as any).national_id ?? (e as any).nif ?? "—", ssn: (e as any).ssn ?? "—", job_title: (e as any).job_title ?? (e as any).position ?? "—", iban: (e as any).iban ?? "—" },
      period: { year: (p as any).year, month: (p as any).month, days: (p as any).days_in_period ?? null },
      items: (items ?? []).map((it: any) => ({ concept: it.concept ?? it.description ?? "Concepto", amount: Number(it.amount ?? 0), type: (it.type ?? "earning") })),
      bases: { cotizacion: totals.baseCotizacion, irpf: totals.baseIRPF },
      contribEmployee: { ss: totals.ssTrab, pctSS: pctSSTrb, irpf: totals.irpf, pctIRPF: pctIRPF, total: totals.ssTrab + totals.irpf },
      contribEmployer: { ss: totals.ssEmp, pctSS: pctSSEmp },
      totals: { devengos: totals.totalDevengos, deducciones: totals.totalDeducciones, neto: totals.neto },
    };

    // Render sin JSX (archivo .ts)
    const buffer = await pdf(React.createElement(ReceiptPDF, data as any)).toBuffer();

    // Hash para versionado
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

    // Subir a Storage
    const bucket = "nominas";
    const y  = String((p as any).year);
    const mm = String((p as any).month).padStart(2, "0");
    const path = `${orgId ?? "org"}/${y}-${mm}/${employeeId}.pdf`;

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType: "application/pdf", upsert: true });
    if (upErr) throw new Error("Error subiendo PDF: " + upErr.message);

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);

    // Registrar (upsert por periodo+empleado)
    const insertPayload: any = {
      payroll_id: payrollId,
      employee_id: employeeId,
      storage_path: path,
      public_url: pub?.publicUrl ?? null,
      sha256,
    };
    if (orgColumn === "org_id") insertPayload.org_id = orgId;
    if (orgColumn === "organization_id") insertPayload.organization_id = orgId;

    const { error: recErr } = await supabase
      .from("payroll_receipts")
      .upsert(insertPayload, { onConflict: "payroll_id,employee_id" });
    if (recErr) throw new Error("Error registrando recibo: " + recErr.message);

    return NextResponse.json({ ok: true, url: pub?.publicUrl ?? null, path, sha256 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}
