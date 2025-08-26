export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { createSupabaseServer } from '@/utils/supabase/server';
import { finalizePayrollAction, upsertPayrollItemAction } from './actions';

export default async function PeriodPage({ params }: { params: { year: string; month: string } }) {
  const year = Number(params.year);
  const month = Number(params.month);
  const supabase = createSupabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return <div>Debes identificarte</div>;

  const { data: payroll } = await supabase
    .from('payrolls')
    .select('id, status, gross_total, net_total, processed_at')
    .eq('period_year', year).eq('period_month', month).single();

  if (!payroll) return <div>No existe nómina del periodo.</div>;

  const { data: items } = await supabase
    .from('payroll_items')
    .select('id, employee_id, base_gross, irpf_amount, ss_emp_amount, ss_er_amount, net, pdf_url, employees:employee_id (full_name)')
    .eq('payroll_id', payroll.id)
    .order('created_at', { ascending: true });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Nómina {String(month).padStart(2,'0')}/{year}</h1>
          <div className="text-sm text-muted-foreground">
            Estado: {payroll.status ?? 'borrador'} · Bruto: €{Number(payroll.gross_total ?? 0).toFixed(2)} · Neto: €{Number(payroll.net_total ?? 0).toFixed(2)}
          </div>
        </div>

        {!payroll.processed_at && (
          <form action={async () => { 'use server'; await finalizePayrollAction(payroll.id); }}>
            <button className="bg-green-600 text-white rounded px-3 py-2">
              Finalizar y generar PDFs
            </button>
          </form>
        )}
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Empleado</th>
              <th className="text-right p-2">Bruto</th>
              <th className="text-right p-2">IRPF</th>
              <th className="text-right p-2">SS Trab.</th>
              <th className="text-right p-2">SS Emp.</th>
              <th className="text-right p-2">Neto</th>
              <th className="text-right p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-2">{it.employees?.full_name ?? it.employee_id}</td>

                {/* Editor por fila */}
                <td className="p-1">
                  <FormCell payrollId={payroll.id} item={it} field="base_gross" />
                </td>
                <td className="p-1">
                  <FormCell payrollId={payroll.id} item={it} field="irpf_amount" />
                </td>
                <td className="p-1">
                  <FormCell payrollId={payroll.id} item={it} field="ss_emp_amount" />
                </td>
                <td className="p-1">
                  <FormCell payrollId={payroll.id} item={it} field="ss_er_amount" />
                </td>

                <td className="p-2 text-right font-medium">€{Number(it.net ?? 0).toFixed(2)}</td>
                <td className="p-2 text-right">
                  {it.pdf_url ? (
                    <a className="text-blue-600 underline" href={`/api/payroll/pdf?path=${encodeURIComponent(it.pdf_url)}`} target="_blank">
                      PDF
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
            {(!items || items.length === 0) && (
              <tr><td className="p-4" colSpan={7}>No hay empleados en la nómina.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Celda con mini-form por campo */
function FormCell({ payrollId, item, field }:{
  payrollId: string,
  item: any,
  field: 'base_gross'|'irpf_amount'|'ss_emp_amount'|'ss_er_amount'
}) {
  return (
    <form
      className="flex items-center justify-end gap-2"
      action={async (fd) => { 'use server'; await upsertPayrollItemAction(fd); }}
    >
      <input type="hidden" name="itemId" value={item.id} />
      <input type="hidden" name="payrollId" value={payrollId} />
      <input type="hidden" name="employeeId" value={item.employee_id} />
      <input
        name={field}
        defaultValue={item[field] ?? 0}
        className="w-28 border rounded px-2 py-1 text-right"
      />
      {/* los otros fieles deben ir también en el form para que el schema los reciba */}
      {['base_gross','irpf_amount','ss_emp_amount','ss_er_amount']
        .filter(f => f !== field)
        .map(f => (
          <input key={f} type="hidden" name={f} defaultValue={item[f] ?? 0} />
        ))
      }
      <button className="bg-blue-600 text-white rounded px-2 py-1">Guardar</button>
    </form>
  );
}
