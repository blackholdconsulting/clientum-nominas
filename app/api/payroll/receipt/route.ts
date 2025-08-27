export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import React from "react";
import { pdf, Document, Page, Text } from "@react-pdf/renderer";
import ReceiptPDF, { ReceiptInput } from "@/lib/pdf/payroll/Receipt";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const BUCKET = "nominas";

function monthLabel(year: number, month: number) {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("es-ES", { year: "numeric", month: "2-digit" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const year = Number(body?.year || new Date().getFullYear());
    const month = Number(body?.month || new Date().getMonth() + 1);
    const employeeId: string | undefined = body?.employeeId || body?.employee || undefined;
    const orgId: string | undefined = body?.orgId || undefined;
    const upload: boolean = !!body?.upload;

    // Cookies API nueva
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options?: any) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options?: any) { cookieStore.set({ name, value: "", ...options }); },
        },
      }
    );

    // Empleado
    let empName = "Empleado";
    let email = "";
    let position = "";
    if (employeeId) {
      const { data: emp, error } = await supabase
        .from("employees")
        .select("id, full_name, first_name, last_name, email, position")
        .eq("id", employeeId)
        .maybeSingle();
      if (error) throw error;
      empName =
        (emp?.full_name ??
          [emp?.first_name, emp?.last_name].filter(Boolean).join(" ")) || "Empleado";
      email = emp?.email ?? "";
      position = emp?.position ?? "";
    }

    // Periodo
    let status: string | null = null;
    let days_in_period: number | null = null;

    const r1 = await supabase
      .from("payrolls")
      .select("id, status, days_in_period")
      .eq("year", year)
      .eq("month", month)
      .maybeSingle();

    if (!r1.error && r1.data) {
      status = r1.data.status ?? null;
      days_in_period = r1.data.days_in_period ?? null;
    } else {
      const r2 = await supabase
        .from("payrolls")
        .select("id, status, days_in_period")
        .eq("period_year", year)
        .eq("period_month", month)
        .maybeSingle();
      if (!r2.error && r2.data) {
        status = r2.data.status ?? null;
        days_in_period = r2.data.days_in_period ?? null;
      }
    }

    // Datos para plantilla
    const input: ReceiptInput = {
      company: { name: "Clientum (demo)", cif: "B-00000000", ccc: "12/34567890/01", address: "Calle Falsa 123, Madrid" },
      employee: { name: empName, email, position, nif: "00000000X", ssn: "12/34567890/01", group: "07" },
      period: { year, month, label: monthLabel(year, month) },
      payroll: { status, daysInPeriod: days_in_period },
      totals: { devengos: 1500, deducciones: 300, liquido: 1200, base_cc: 1500, base_irpf: 1500, irpf_pct: 12.0, ss_emp_pct: 6.35 },
      lines: [
        { code: "SBASE", label: "Salario base", units: 30, amount: 1200, category: "salarial" },
        { code: "COMPL", label: "Complemento", units: 30, amount: 300, category: "salarial" },
        { code: "SS", label: "Seguridad Social trabajador", amount: -95.25, category: "deduccion" },
        { code: "IRPF", label: "IRPF", amount: -180, category: "deduccion" },
      ],
    };

    // Intento 1: plantilla completa
    let buffer: Buffer;
    try {
      const element = React.createElement(ReceiptPDF, input);
      buffer = await pdf(element).toBuffer();
    } catch (e) {
      console.error("Error renderizando plantilla completa. Fallback simple.", e);

      // Fallback simple (si hubiera cualquier problema dentro del árbol PDF)
      const Simple = () =>
        React.createElement(
          Document,
          null,
          React.createElement(
            Page,
            { size: "A4", style: { padding: 24, fontSize: 12 } },
            React.createElement(Text, null, `Recibo de salarios — ${input.period.label}`),
            React.createElement(Text, null, `Empleado: ${input.employee.name}`),
            React.createElement(Text, null, `Periodo: ${String(month).padStart(2, "0")}/${year}`),
            React.createElement(Text, null, `Estado: ${status ?? "borrador"}`),
            React.createElement(Text, { style: { marginTop: 12 } }, `Líquido a percibir: ${new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(input.totals.liquido)}`)
          )
        );

      buffer = await pdf(React.createElement(Simple)).toBuffer();
    }

    // (Opcional) subir a Storage
    let publicUrl: string | null = null;
    if (upload) {
      const filename = `nomina_${year}_${String(month).padStart(2, "0")}_${(employeeId ?? "emp").slice(0, 8)}.pdf`;
      const path = `${orgId ?? "default"}/${filename}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType: "application/pdf", upsert: true });
      if (!upErr) {
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        publicUrl = pub.publicUrl ?? null;
      }
    }

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="recibo_${year}_${String(month).padStart(2, "0")}.pdf"`,
        ...(publicUrl ? { "X-File-Url": publicUrl } : {}),
      },
    });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e?.message ?? "Error generando el PDF" }, { status: 500 });
  }
}
