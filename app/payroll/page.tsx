// app/payroll/page.tsx
import { supabaseServer } from '@/lib/supabase/server';
import { createPayrollAction, deletePayrollAction, markAsPaidAction } from './actions';
import { revalidatePath } from 'next/cache';

function currency(n: number | null | undefined) {
  const v = Number(n ?? 0);
  return v.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

function monthName(m: number) {
  return new Date(2000, m - 1, 1).toLocaleDateString('es-ES', { month: 'long' });
}

async function getData() {
  const supabase = supabaseServer();

  // Usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, employeesCount: 0, last: null, periods: [] as any[] };

  // Total empleados (RLS ya filtra por user_id)
  const { count: employeesCount } = await supabase
    .from('employees')
    .select('id', { count: 'exact', head: true });

  // Periodos de nómina (ordenados por fecha desc)
  const { data: periods } = await supabase
    .from('payrolls')
    .select('id, period_year, period_month, gross_total, net_total, status, created_at')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });

  const last = periods?.[0] ?? null;

  return { user, employeesCount: employeesCount ?? 0, last, periods: periods ?? [] };
}

export default async function PayrollPage() {
  const { user, employeesCount, last, periods } = await getData();

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Gestión de Nóminas</h1>
        <p className="text-sm text-muted-foreground">Debes iniciar sesión.</p>
      </div>
    );
  }

  // Próximo pago = último día del mes actual (puedes ajustarlo)
  const now = new Date();
  const nextPay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientum Nóminas</h1>
          <p className="text-sm text-muted-foreground">Nóminas</p>
        </div>

        {/* Crear nómina (periodo por defecto: mes actual) */}
        <form action={async (fd) => {
          'use server';
          await createPayrollAction(fd);
          revalidatePath('/payroll');
        }}>
          <input type="hidden" name="month" value={now.getMonth() + 1} />
          <input type="hidden" name="year" value={now.getFullYear()} />
          <button
            className="inline-flex items-center gap-2 rounded-md bg-clientum-blue px-4 py-2 text-white shadow-clientum hover:bg-clientum-blueDark"
            type="submit"
          >
            + Nueva Nómina
          </button>
        </form>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Total Empleados</p>
          <p className="text-2xl font-semibold mt-1">{employeesCount}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Nómina Bruta</p>
          <p className="text-2xl font-semibold mt-1">{currency(last?.gross_total)}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Nómina Neta</p>
          <p className="text-2xl font-semibold mt-1">{currency(last?.net_total)}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Próximo Pago</p>
          <p className="text-2xl font-semibold mt-1">{nextPay}</p>
        </div>
      </div>

      {/* Historial */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Nóminas Procesadas</h2>
        <p className="text-sm text-muted-foreground">
          Historial de nóminas procesadas y pendientes
        </p>

        <div className="divide-y rounded-xl border">
          {periods.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">Aún no hay nóminas.</div>
          )}

          {periods.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium">
                  {monthName(p.period_month)} {p.period_year}
                </div>
                <div className="text-sm text-muted-foreground">
                  {/* Puedes sumarizar aquí: empleados y fecha procesada si quieres */}
                  Procesada: {new Date(p.created_at).toLocaleDateString('es-ES')}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Neto</div>
                  <div className="font-medium">{currency(p.net_total)}</div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    p.status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {p.status === 'paid' ? 'Pagada' : 'Procesada'}
                </span>

                <div className="flex items-center gap-2">
                  {/* Marcar como pagada */}
                  {p.status !== 'paid' && (
                    <form action={async () => {
                      'use server';
                      await markAsPaidAction(p.id);
                      revalidatePath('/payroll');
                    }}>
                      <button className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
                        Marcar pagada
                      </button>
                    </form>
                  )}

                  {/* Borrar nómina */}
                  <form action={async () => {
                    'use server';
                    await deletePayrollAction(p.id);
                    revalidatePath('/payroll');
                  }}>
                    <button className="rounded-md border px-3 py-1 text-sm text-red-600 hover:bg-red-50">
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
