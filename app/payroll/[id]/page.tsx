import { createClient } from '@/utils/supabase/server';
import { finalizePayrollAction, updateItemAction } from './actions';

export default async function PayrollEditor({ params }: { params: { id: string } }) {
  const s = createClient();
  const { data: header } = await s.from('payrolls').select('*').eq('id', params.id).single();
  const { data: items }  = await s.from('payroll_items')
    .select('id, employee_id, base_salary, bonus, overtime, other_income, irpf_rate, ss_rate, other_deduction, employees(full_name,email)')
    .eq('payroll_id', params.id)
    .order('created_at', { ascending: true });

  const readOnly = header?.status !== 'draft';

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Nómina {String(header.period_month).padStart(2,'0')}/{header.period_year} · <span className="capitalize">{header.status}</span>
        </h1>
        <a className="rounded border px-4 py-2" href="/payroll">Volver</a>
      </div>

      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Empleado</th>
              <th className="px-3 py-2 text-right">Base</th>
              <th className="px-3 py-2 text-right">Bonus</th>
              <th className="px-3 py-2 text-right">Extra</th>
              <th className="px-3 py-2 text-right">Otros</th>
              <th className="px-3 py-2 text-right">IRPF</th>
              <th className="px-3 py-2 text-right">SS</th>
              <th className="px-3 py-2 text-right">Otras ded.</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(items ?? []).map((it: any) => (
              <tr key={it.id}>
                <td className="px-3 py-2">
                  <div className="font-medium">{it.employees?.full_name}</div>
                  <div className="text-xs text-gray-500">{it.employees?.email}</div>
                </td>

                {([
                  ['base_salary','number'],
                  ['bonus','number'],
                  ['overtime','number'],
                  ['other_income','number'],
                  ['irpf_rate','percent'],
                  ['ss_rate','percent'],
                  ['other_deduction','number'],
                ] as const).map(([field, kind]) => {
                  const value = it[field] ?? 0;
                  const step  = kind === 'percent' ? 0.001 : 0.01;
                  return (
                    <td key={field} className="px-3 py-2 text-right">
                      {readOnly ? (
                        <span>{Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      ) : (
                        <form
                          action={async (fd: FormData) => {
                            'use server';
                            const v = Number(fd.get('v'));
                            await updateItemAction(it.id, { [field]: v });
                          }}
                        >
                          <input name="v" type="number" defaultValue={value} step={step}
                                 className="w-28 rounded border px-2 py-1 text-right" />
                        </form>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Bruto total: {(header?.gross_total ?? 0).toLocaleString('es-ES', { style:'currency', currency:'EUR' })} ·
          Neto total: {(header?.net_total ?? 0).toLocaleString('es-ES', { style:'currency', currency:'EUR' })}
        </div>

        {header?.status === 'draft' && (
          <form action={async () => { 'use server'; await finalizePayrollAction(header.id); }}>
            <button className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">Finalizar</button>
          </form>
        )}
      </div>
    </div>
  );
}
