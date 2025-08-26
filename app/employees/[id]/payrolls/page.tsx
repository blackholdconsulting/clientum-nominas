export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { createSupabaseServer } from '@/utils/supabase/server';

export default async function EmployeePayrollsPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServer();
  const empId = params.id;

  const { data: rows, error } = await supabase
    .from('v_employee_payroll_history')
    .select('*')
    .eq('employee_id', empId)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });
  if (error) throw error;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-xl font-semibold mb-4">Histórico de Nóminas</h1>
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Periodo</th>
              <th className="text-right p-2">Bruto</th>
              <th className="text-right p-2">Neto</th>
              <th className="text-left p-2">Estado</th>
              <th className="text-right p-2">PDF</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={`${r.payroll_id}-${r.employee_id}`} className="border-t">
                <td className="p-2">{String(r.period_month).padStart(2,'0')}/{r.period_year}</td>
                <td className="p-2 text-right">€{Number(r.base_gross ?? 0).toFixed(2)}</td>
                <td className="p-2 text-right">€{Number(r.net ?? 0).toFixed(2)}</td>
                <td className="p-2">{r.processed_at ? 'Procesada' : 'Borrador'}</td>
                <td className="p-2 text-right">
                  {r.pdf_url ? (
                    <a className="text-blue-600 underline" href={`/api/payroll/pdf?path=${encodeURIComponent(r.pdf_url)}`} target="_blank">
                      Ver PDF
                    </a>
                  ) : '—'}
                </td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
              <tr><td className="p-4" colSpan={5}>Sin nóminas aún.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
