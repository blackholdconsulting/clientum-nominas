// app/employees/[id]/payrolls/page.tsx
import { createClient } from '@/utils/supabase/server';

export default async function EmployeeHistory({ params }: { params: { id: string } }) {
  const s = createClient();
  const { data } = await s
    .from('v_employee_payroll_history')
    .select('*')
    .eq('employee_id', params.id)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Histórico de Nóminas</h1>
      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Periodo</th>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-right">Bruto</th>
              <th className="px-3 py-2 text-right">Neto</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(data ?? []).map((r: any) => (
              <tr key={r.payroll_item_id}>
                <td className="px-3 py-2">{String(r.period_month).padStart(2,'0')}/{r.period_year}</td>
                <td className="px-3 py-2 capitalize">{r.status}</td>
                <td className="px-3 py-2 text-right">{Number(r.gross).toLocaleString('es-ES',{style:'currency',currency:'EUR'})}</td>
                <td className="px-3 py-2 text-right">{Number(r.net).toLocaleString('es-ES',{style:'currency',currency:'EUR'})}</td>
                <td className="px-3 py-2 text-right">
                  <a className="text-[#2563eb] hover:underline" href={`/payroll/${r.payroll_id}`}>Abrir</a>
                </td>
              </tr>
            ))}
            {(data ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500">Sin registros</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
