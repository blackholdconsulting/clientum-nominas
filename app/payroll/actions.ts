"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/utils/supabase/server";

/** Genera (o abre) la nómina del periodo. Devuelve payroll_id. */
export async function generatePayroll(year: number, month: number) {
  const s = createSupabaseServer();
  const { data, error } = await s.rpc("payroll_generate_period", {
    p_year: year,
    p_month: month,
  });
  if (error) throw error;
  revalidatePath(`/payroll`);
  return data as string;
}

/** Guarda una línea (formData con campos numéricos) */
export async function saveItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const patch = {
    base_gross: Number(formData.get("base_gross") ?? 0),
    irpf_amount: Number(formData.get("irpf_amount") ?? 0),
    ss_emp_amount: Number(formData.get("ss_emp_amount") ?? 0),
    ss_er_amount: Number(formData.get("ss_er_amount") ?? 0),
    net: Number(formData.get("net") ?? 0),
  };
  const s = createSupabaseServer();
  const { error } = await s.from("payroll_items").update(patch).eq("id", id);
  if (error) throw error;

  // intenta leer el payroll_id para revalidar/redirect si hace falta
  const { data: item } = await s
    .from("payroll_items")
    .select("payroll_id")
    .eq("id", id)
    .maybeSingle();

  if (item?.payroll_id) {
    const { data: hdr } = await s
      .from("payrolls")
      .select("period_year,period_month")
      .eq("id", item.payroll_id)
      .maybeSingle();
    if (hdr) revalidatePath(`/payroll/period/${hdr.period_year}/${hdr.period_month}`);
  }
  return { ok: true };
}

/** Finaliza la nómina (sella) y revalida */
export async function finalizePayroll(payrollId: string) {
  const s = createSupabaseServer();
  const { error } = await s.rpc("payroll_finalize", { p_payroll: payrollId });
  if (error) throw error;

  const { data: hdr } = await s
    .from("payrolls")
    .select("period_year,period_month")
    .eq("id", payrollId)
    .single();
  revalidatePath(`/payroll/period/${hdr.period_year}/${hdr.period_month}`);
  return { ok: true };
}

/** Compat: algunas páginas importan upsertPayroll desde ../../actions */
export async function upsertPayroll(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const period_year = Number(formData.get("period_year") ?? 0);
  const period_month = Number(formData.get("period_month") ?? 0);
  const status = String(formData.get("status") ?? "draft");

  const s = createSupabaseServer();
  if (id) {
    const { error } = await s
      .from("payrolls")
      .update({ period_year, period_month, status })
      .eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await s
      .from("payrolls")
      .insert({ period_year, period_month, status });
    if (error) throw error;
  }
  revalidatePath("/payroll");
  redirect("/payroll");
}

/** Shim: hay vistas que siguen llamando a "createOrOpenPayrollAction" desde /payroll/new */
export async function createOrOpenPayrollAction(formData: FormData) {
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  const id = await generatePayroll(year, month);
  if (!id) throw new Error("No se pudo generar la nómina");
  redirect(`/payroll/period/${year}/${month}`);
}
