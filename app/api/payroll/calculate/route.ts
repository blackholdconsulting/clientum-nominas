// app/api/payroll/calculate/route.ts
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getActiveOrgId } from '@/lib/org'

export async function POST() {
  const { supabase } = await requireUser()
  const orgId = await getActiveOrgId()
  if (!orgId) return NextResponse.json({ error: 'No org' }, { status: 400 })

  const { data: run } = await supabase
    .from('payroll.payroll_runs')
    .select('id')
    .eq('organization_id', orgId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!run) return NextResponse.json({ error: 'No draft run' }, { status: 400 })

  const { data: contracts, error } = await supabase
    .from('payroll.contracts')
    .select('employee_id, salary_base, workday_pct')
    .eq('organization_id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const slips = (contracts ?? []).map(c => {
    const gross = Number(c.salary_base) * Number(c.workday_pct) / 100
    const ssEmp = +(gross * 0.064).toFixed(2)
    const ssEr  = +(gross * 0.30).toFixed(2)
    const irpf  = +(gross * 0.08).toFixed(2)
    const net   = +(gross - ssEmp - irpf).toFixed(2)
    return {
      organization_id: orgId,
      payroll_run_id: run.id,
      employee_id: c.employee_id,
      gross_salary: gross,
      ss_employee: ssEmp,
      ss_employer: ssEr,
      irpf,
      net_pay: net
    }
  })

  const { error: insErr, count } = await supabase
    .from('payroll.payslips')
    .insert(slips, { count: 'exact' })

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, count })
}
