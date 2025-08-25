// app/payroll/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/utils/supabase/server";

/**
 * Crea (o abre) la nómina de un periodo (año/mes) para el usuario actual.
 * - Si ya existe, devuelve su id.
 * - Si no existe, la crea en BORRADOR.
 * - Intenta clonar los items del periodo anterior; si no hay, crea items vacíos para
 *   todos los empleados del usuario.
 * - Recalcula totales (RPC) y devuelve el id.
 */
export async function generatePayroll(year: number, month: number) {
  const s = createSupabaseServer();

  const { data: auth, error: authErr } = await s.auth.getUser();
  if (authErr || !auth?.user) {
    throw new Error("No autenticado");
  }
  const userId = auth.user.id;

  // 1) ¿Ya existe la nómina del periodo?
  const { data: existing, error: exErr } = await s
    .from("payrolls")
    .select("id")
    .eq("user_id", userId)
    .eq("period_year", year)
    .eq("period_month", month)
    .maybeSingle();

  if (exErr) throw new Error(exErr.message);
  if (existing?.id) return existing.id as string;

  // 2) Insertar cabecera en borrador
  const { data: inserted, error: insErr } = await s
    .from("payrolls")
    .insert({
      user_id: userId,
      period_year: year,
      period_month: month,
      status: "draft",
      gross_total: 0,
      net_total: 0,
    })
    .select("id")
    .single();

  if (insErr) throw new Error(insErr.message);
  const payrollId = inserted.id as string;

  // 3) Intentar clonar items del periodo anterior; si no hay, crear vacíos
  const prev =
    month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };

  // 3a) Buscar cabecera anterior
  const { data: prevHeader } = await s
    .from("payrolls")
    .select("id")
    .eq("user_id", userId)
    .eq("period_year", prev.y)
    .eq("period_month", prev.m)
    .maybeSingle();

  let itemsToInsert:
    | {
        payroll_id: string;
        user_id: string;
        employee_id: string;
        base_gross: number;
        irpf_amount: number;
        ss_emp_amount: number;
        ss_er_amount: number;
        net: number;
      }[] = [];

  if (prevHeader?.id) {
    // 3b) Clonar del periodo anterior
    const { data: prevItems } = await s
      .from("payroll_items")
      .select(
        "employee_id, base_gross, irpf_amount, ss_emp_amount, ss_er_amount, net"
      )
      .eq("payroll_id", prevHeader.id);

    itemsToInsert =
      prevItems?.map((i) => ({
        payroll_id: payrollId,
        user_id: userId,
        employee_id: i.employee_id as string,
        base_gross: Number(i.base_gross ?? 0),
        irpf_amount: Number(i.irpf_amount ?? 0),
        ss_emp_amount: Number(i.ss_emp_amount ?? 0),
        ss_er_amount: Number(i.ss_er_amount ?? 0),
        net: Number(i.net ?? 0),
      })) ?? [];
  } else {
    // 3c) Crear items vacíos para todos los empleados del usuario
    const { data: emps } = await s
      .from("employees")
      .select("id")
      .eq("user_id", userId);

    itemsToInsert =
      emps?.map((e) => ({
        payroll_id: payrollId,
        user_id: userId,
        employee_id: e.id as string,
        base_gross: 0,
        irpf_amount: 0,
        ss_emp_amount: 0,
        ss_er_amount: 0,
        net: 0,
      })) ?? [];
  }

  if (itemsToInsert.length) {
    const { error: itemsErr } = await s
      .from("payroll_items")
      .insert(itemsToInsert);
    if (itemsErr) throw new Error(itemsErr.message);
  }

  // 4) Recalcular totales (si existe el RPC; si no, no bloquea)
  //   - Asegúrate de que el RPC se llame recalc_payroll_totals(payroll uuid)
  await s.rpc("recalc_payroll_totals", { payroll: payrollId }).catch(() => {});

  // 5) Revalidate listado
  revalidatePath("/payroll");

  return payrollId;
}
