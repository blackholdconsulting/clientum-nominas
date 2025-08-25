// app/payroll/page.tsx
import { createClient } from '@/utils/supabase/server'; // tu helper server
import BackButton from '@/components/BackButton';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PayrollPage() {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from('payrolls')
    .select('period_year, period_month, status, gross_total, net_total, created_at')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <BackButton />
        <h1 className="text-2xl font-semibold mt-4">Gestión de Nóminas</h1>
        <p className="text-red-600 mt-4">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <BackButton />
      <div className="flex items-center justify-between mt-2">
        <h1 className="text-2xl font-semibold">Gestión de Nóminas</h1>
        <Link
          href="/payroll/new"
          className="rounded-xl bg-clientum-blue px-4 py-2 text-white hover:bg-clientum-blueDark shadow-clientum"
        >
          + Nueva Nómina
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-6">
        {rows?.map((r, i) => {
          const y = r.period_year ?? new Date(r.created_at!).getFullYear();
          const m = (r.period_month ?? new Date(r.created_at!).getMonth() + 1)
            .toString()
            .padStart(2, '0');

          return (
            <div
              key={`${y}-${m}-${i}`}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-medium">
                    {new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
                      new Date(`${y}-${m}-01`)
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Estado: {r.status ?? 'processed'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Neto</div>
                  <div className="text-xl font-semibold">
                    {new Intl.NumberFormat('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                    }).format(r.net_total ?? 0)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {(!rows || rows.length === 0) && (
          <div className="rounded-2xl border bg-white p-8 text-center text-gray-500">
            Aún no tienes nóminas creadas.
          </div>
        )}
      </div>
    </div>
  );
}
