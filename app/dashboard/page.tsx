// app/dashboard/page.tsx
export const dynamic = 'force-dynamic';

import { supabaseServer } from '@/lib/supabase/server';

type Stats = {
  active_employees?: number;
  gross_total?: number;
  net_total?: number;
  irpf_total?: number;
  last_payroll_at?: string | null;
};

export default async function DashboardPage() {
  let userEmail: string | undefined;
  let stats: Stats = {};
  let errorMsg: string | null = null;

  try {
    const supabase = supabaseServer();

    // 1) usuario
    const { data: auth, error: aerr } = await supabase.auth.getUser();
    if (aerr) throw aerr;
    userEmail = auth.user?.email;

    // 2) datos del dashboard (ajusta a tu esquema real)
    // Si antes llamabas a una vista o función, protégela con try/catch.
    // Ejemplo: una vista v_dashboard_resume o similar:
    const { data, error } = await supabase
      .from('v_dashboard_resume')      // <- cambia por tu tabla/vista/función
      .select('*')
      .single();

    if (error) throw error;

    stats = {
      active_employees: data?.active_employees ?? 0,
      gross_total: data?.gross_total ?? 0,
      net_total: data?.net_total ?? 0,
      irpf_total: data?.irpf_total ?? 0,
      last_payroll_at: data?.last_payroll_at ?? null,
    };
  } catch (e: any) {
    errorMsg = e?.message ?? String(e);
    // No lanzamos: devolvemos UI con el error
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bienvenido{userEmail ? `, ${userEmail}` : ''}</h1>
        <p className="text-sm text-gray-500">Resumen de nóminas</p>
      </div>

      {errorMsg ? (
        <div className="rounded-lg border bg-red-50 text-red-800 p-4">
          <p className="font-medium">No se pudo cargar el dashboard.</p>
          <p className="text-sm mt-1">Detalle: {errorMsg}</p>
          <p className="text-xs text-red-700 mt-2">
            Si el problema persiste, revisa logs del servidor o /api/diag.
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card title="Empleados activos" value={stats.active_employees ?? 0} />
          <Card
            title="Total Bruto"
            value={formatCurrency(stats.gross_total ?? 0)}
          />
          <Card
            title="Neto a pagar"
            value={formatCurrency(stats.net_total ?? 0)}
          />
          <Card title="IRPF" value={formatCurrency(stats.irpf_total ?? 0)} />
        </section>
      )}

      <div className="text-sm text-gray-500">
        Última nómina: {stats.last_payroll_at ? new Date(stats.last_payroll_at).toLocaleDateString() : '—'}
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border p-4 bg-white">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n);
}
