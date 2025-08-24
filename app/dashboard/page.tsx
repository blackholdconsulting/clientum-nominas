export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth";

export default async function Dashboard() {
  const { supabase, user } = await requireUser();

  // Si tus tablas tienen 'user_id' como dueño, usamos eso:
  //   payroll.employees.user_id
  //   payroll.payroll_runs.user_id
  // Cambia a 'tenant_id' o 'account_id' si ése es tu campo real.

  // 1) Métricas básicas
  const { count: employeesCount = 0 } = await supabase
    .from("payroll.employees")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: latestRun } = await supabase
    .from("payroll.payroll_runs")
    .select("id, period_year, period_month, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 2) Totales del último run (si existe)
  let totals = { gross: 0, net: 0, irpf: 0, ss_er: 0 };
  if (latestRun?.id) {
    const { data } = await supabase.rpc("payroll_totals_by_run", {
      p_run_id: latestRun.id,
    });
    if (data) {
      totals = {
        gross: Number(data.gross || 0),
        net: Number(data.net || 0),
        irpf: Number(data.irpf || 0),
        ss_er: Number(data.ss_er || 0),
      };
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Bienvenido</h1>

      <div className="grid md:grid-cols-4 gap-4">
        <Card title="Empleados activos" value={employeesCount} />
        <Card title="Total Bruto" value={`€${totals.gross.toFixed(2)}`} />
        <Card title="Neto a pagar" value={`€${totals.net.toFixed(2)}`} />
        <Card title="IRPF" value={`€${totals.irpf.toFixed(2)}`} />
      </div>

      <div className="text-sm text-gray-500">
        Última nómina:{" "}
        {latestRun
          ? `${latestRun.period_month}/${latestRun.period_year} (${latestRun.status})`
          : "—"}
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
    </div>
  );
}
