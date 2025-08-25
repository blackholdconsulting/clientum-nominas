"use server";

import { createSupabaseServer } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buildPayrollPdf } from "@/utils/pdf/buildPayrollPdf";
import { uploadPdf } from "@/utils/pdf/upload";

export async function generatePayroll(year: number, month: number) {
  const supabase = createSupabaseServer();
  const { data, error } = await supabase.rpc("payroll_generate_period", { p_year: year, p_month: month });
  if (error) throw error;
  revalidatePath(`/payroll/${year}/${month}`);
  return data as string; // payroll_id
}

const SaveItemSchema = z.object({
  id: z.string(),
  base_gross: z.coerce.number(),
  irpf_amount: z.coerce.number(),
  ss_emp_amount: z.coerce.number(),
  ss_er_amount: z.coerce.number(),
  net: z.coerce.number(),
});

export async function saveItem(form: FormData) {
  const parsed = SaveItemSchema.parse({
    id: form.get("id"),
    base_gross: form.get("base_gross"),
    irpf_amount: form.get("irpf_amount"),
    ss_emp_amount: form.get("ss_emp_amount"),
    ss_er_amount: form.get("ss_er_amount"),
    net: form.get("net"),
  });

  const supabase = createSupabaseServer();
  const { error } = await supabase
    .from("payroll_items")
    .update({
      base_gross: parsed.base_gross,
      irpf_amount: parsed.irpf_amount,
      ss_emp_amount: parsed.ss_emp_amount,
      ss_er_amount: parsed.ss_er_amount,
      net: parsed.net,
    })
    .eq("id", parsed.id);

  if (error) throw error;
  return { ok: true };
}

export async function finalizePayroll(payrollId: string) {
  const supabase = createSupabaseServer();

  // Sella la nómina
  const { error: e1 } = await supabase.rpc("payroll_finalize", { p_payroll: payrollId });
  if (e1) throw e1;

  // Descarga items + empleados para generar PDFs
  const { data: header, error: e2 } = await supabase
    .from("payrolls")
    .select("*")
    .eq("id", payrollId)
    .single();
  if (e2) throw e2;

  const { data: items, error: e3 } = await supabase
    .from("payroll_items")
    .select("*, employees:employee_id (full_name, email)")
    .eq("payroll_id", payrollId);
  if (e3) throw e3;

  // Genera y sube un PDF por empleado
  for (const item of items ?? []) {
    const pdfBytes = await buildPayrollPdf({ header, item });
    await uploadPdf({
      supabase,
      bytes: pdfBytes,
      path: `${header.user_id}/${header.period_year}-${String(header.period_month).padStart(2,"0")}/${item.employee_id}.pdf`,
    });
  }

  return { ok: true };
}
