import { createClient } from '@/utils/supabase/server';

export default async function PayrollListPage() {
  const s = createClient();
  const { data } = await s.from('payrolls')
    .select('id, period_year, period_month, status, gross_total, net_total, created_at')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gestión de Nóminas</h1>
        <a href="/payroll/new" className="rounded bg-[#2563eb] px-4 py-2 text-white hover:bg-[#1d4ed8]">Nueva Nómina</a>
      </div>

      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Periodo</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Bruto</th>
              <th className="px-4 py-3 text-right">Neto</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(data ?? []).map((p: any) => (
              <tr key={p.id}>
                <td className="px-4 py-3">{String(p.period_month).padStart(2,'0')}/{p.period_year}</td>
                <td className="px-4 py-3 capitalize">{p.status}</td>
                <td className="px-4 py-3 text-right">{(p.gross_total ?? 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                <td className="px-4 py-3 text-right">{(p.net_total ?? 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                <td className="px-4 py-3 text-right">
                  <a className="text-[#2563eb] hover:underline" href={`/payroll/${p.id}`}>Abrir</a>
                </td>
              </tr>
            ))}
            {(data ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Aún no tienes nóminas creadas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
