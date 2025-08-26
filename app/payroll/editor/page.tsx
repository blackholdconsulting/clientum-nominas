// app/payroll/editor/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import PayrollEditorClient from "@/components/payroll/PayrollEditorClient";

export const runtime = "nodejs";

type Row = {
  employee_id: number;
  name: string;
  nif?: string | null;
  gross?: number | null;
  net?: number | null;
  notes?: string | null;
};

async function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  );
}

// Garantiza que existe el payroll (borrador) y devuelve su id
async function ensurePayrollId(year: number, month: number): Promise<number> {
  const supabase = await getSupabase();

  const {
    data: { user },
    error: uErr,
  } = await supabase.auth.getUser();
  if (uErr || !user) redirect("/login");

  // ¿ya existe?
  const { data: found, error: selErr } = await supabase
    .from("payrolls")
    .select("id")
    .eq("owner_id", user.id)
    .eq("period_year", year)
    .eq("period_month", month)
    .maybeSingle();

  if (selErr) throw selErr;
  if (found?.id) return found.id;

  // si no existe, upsert
  const { data: up, error: upErr } = await supabase
    .from("payrolls")
    .upsert(
      [{ owner_id: user.id, period_year: year, period_month: month, status: "draft" }],
      { onConflict: "owner_id,period_year,period_month" }
    )
    .select("id")
    .single();

  if (upErr) throw upErr;
  return up!.id;
}

// SERVER ACTION: guardar líneas de nómina
export async function savePayrollItems(payrollId: number, rows: Row[]) {
  "use server";
  const supabase = await getSupabase();

  const upserts = rows.map((r) => ({
    payroll_id: payrollId,
    employee_id: r.employee_id,
    gross: r.gross ?? null,
    net: r.net ?? null,
    notes: r.notes ?? null,
  }));

  const { error } = await supabase
    .from("payroll_items")
    .upsert(upserts, { onConflict: "payroll_id,employee_id" });
  if (error) throw error;
}

export default async function Page({
  searchParams,
}: {
  searchParams: { year?: string; month?: string };
}) {
  const year = Number(searchParams.year);
  const month = Number(searchParams.month);
  if (!year || !month || month < 1 || month > 12) redirect("/payroll");

  const supabase = await getSupabase();

  // usuario
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // payroll (crea si no existe)
  const payrollId = await ensurePayrollId(year, month);

  // empleados del propietario (ajusta el nombre de tabla/campos si usas otros)
  const { data: employees, error: empErr } = await supabase
    .from("employees")
    .select("id, full_name, nif")
    .eq("owner_id", user.id)
    .order("full_name", { ascending: true });

  if (empErr) throw empErr;

  // líneas guardadas (si hubiera)
  const { data: items, error: itErr } = await supabase
    .from("payroll_items")
    .select("employee_id, gross, net, notes")
    .eq("payroll_id", payrollId);

  if (itErr) throw itErr;

  // join empleados + items
  const map = new Map<number, Row>();
  (employees ?? []).forEach((e) =>
    map.set(e.id, {
      employee_id: e.id,
      name: e.full_name,
      nif: e.nif ?? null,
    })
  );
  (items ?? []).forEach((i) => {
    const r = map.get(i.employee_id);
    if (r) {
      r.gross = i.gross;
      r.net = i.net;
      r.notes = i.notes;
    }
  });

  const rows: Row[] = Array.from(map.values());

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Editor de nómina {month}/{year}
      </h1>
      <PayrollEditorClient
        payrollId={payrollId}
        initialRows={rows}
        onSave={savePayrollItems}
      />
    </div>
  );
}
