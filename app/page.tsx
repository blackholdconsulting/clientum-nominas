import { requireUser } from '@/lib/auth'
import { getActiveOrgId } from '@/lib/org'

export default async function Dashboard() {
  const { supabase } = await requireUser()
  const orgId = await getActiveOrgId()
  if (!orgId) return null

  const [{ data: empCount }, { data: latestRun }] = await Promise.all([
    supabase.from('payroll.employees').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('payroll.payroll_runs').select('id, period_year, period_month, status')
      .eq('organization_id', orgId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  // totales del último run aprobado/cerrado
  let totals = { gross: 0, net: 0, irpf: 0, ss_er: 0 }
  if (latestRun?.id) {
    const { data } = await supabase.rpc('payroll_totals_by_run', { p_run_id: latestRun.id })
    if (data) totals = data
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Bienvenido</h1>
      <div className="grid md:grid-cols-4 gap-4">
        <Card title="Empleados activos" value={empCount ?? 0} />
        <Card title="Total Bruto" value={`€${totals.gross.toFixed(2)}`} />
        <Card title="Neto a pagar" value={`€${totals.net.toFixed(2)}`} />
        <Card title="IRPF" value={`€${totals.irpf.toFixed(2)}`} />
      </div>
      <div className="text-sm text-muted-foreground">
        Última nómina: {latestRun ? `${latestRun.period_month}/${latestRun.period_year} (${latestRun.status})` : '—'}
      </div>
    </div>
  )
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
    </div>
  )
}
