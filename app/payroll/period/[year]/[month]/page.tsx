import { createSupabaseServer } from "@/utils/supabase/server";
import { finalizePayroll, saveItem } from "../../actions";

export default async function PeriodPage({ params }: { params: { year: string; month: string } }) {
  const year = Number(params.year);
  const month = Number(params.month);
  const supabase = createSupabaseServer();

  // Garantiza que exista
  const { data: payrollId } = await supabase.rpc("payroll_generate_period", { p_year: year, p_month: month });

  const { data: header } = await supabase.from("payrolls").select("*").eq("id", payrollId).single();
  const { data: items } = await supabase
    .from("payroll_items")
    .select("id, employee_id, employees:employee_id(full_name,email), base_gross, irpf_amount, ss_emp_amount, ss_er_amount, net")
    .eq("payroll_id", payrollId)
    .order("created_at");

  async function onSave(formData: FormData) {
    "use server";
    await saveItem(formData);
  }

  async function onFinalize() {
    "use server";
    await finalizePayroll(payrollId as string);
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Nómina {month}/{year}</h1>
        {header?.status === "draft" ? (
          <form action={onFinalize}>
            <button className="bg-emerald-600 text-white px-4 py-2 rounded">Finalizar & Generar PDFs</button>
          </form>
        ) : (
          <span className="text-sm rounded bg-emerald-50 text-emerald-700 px-2 py-1">Finalizada</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Empleado</th>
              <th className="p-2 text-right">Bruto</th>
              <th className="p-2 text-right">IRPF</th>
              <th className="p-2 text-right">SS Trab.</th>
              <th className="p-2 text-right">SS Emp.</th>
              <th className="p-2 text-right">Neto</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">
                  <div className="font-medium">{r.employees?.full_name ?? r.employee_id}</div>
                  <div className="text-xs text-gray-500">{r.employees?.email}</div>
                </td>
                <td className="p-2 text-right">{Number(r.base_gross).toFixed(2)}</td>
                <td className="p-2 text-right">{Number(r.irpf_amount).toFixed(2)}</td>
                <td className="p-2 text-right">{Number(r.ss_emp_amount).toFixed(2)}</td>
                <td className="p-2 text-right">{Number(r.ss_er_amount).toFixed(2)}</td>
                <td className="p-2 text-right">{Number(r.net).toFixed(2)}</td>
                <td className="p-2">
                  {header?.status === "draft" && (
                    <form action={onSave} className="flex gap-2 items-center">
                      <input type="hidden" name="id" defaultValue={r.id} />
                      <input name="base_gross" defaultValue={r.base_gross} className="w-24 border rounded px-2 py-1 text-right" />
                      <input name="irpf_amount" defaultValue={r.irpf_amount} className="w-20 border rounded px-2 py-1 text-right" />
                      <input name="ss_emp_amount" defaultValue={r.ss_emp_amount} className="w-20 border rounded px-2 py-1 text-right" />
                      <input name="ss_er_amount" defaultValue={r.ss_er_amount} className="w-20 border rounded px-2 py-1 text-right" />
                      <input name="net" defaultValue={r.net} className="w-24 border rounded px-2 py-1 text-right" />
                      <button className="bg-[#1061FE] text-white px-3 py-1 rounded">Guardar</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-right text-sm text-gray-600">
        Totales — Bruto: <b>{Number(header?.gross_total ?? 0).toFixed(2)} €</b> · Neto: <b>{Number(header?.net_total ?? 0).toFixed(2)} €</b>
      </div>
    </div>
  );
}
