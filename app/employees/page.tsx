import { requireUser } from '@/lib/auth'
import { getActiveOrgId } from '@/lib/org'

export default async function EmployeesPage() {
  const { supabase } = await requireUser()
  const orgId = await getActiveOrgId()
  const { data: employees, error } = await supabase
    .from('payroll.employees')
    .select('id, person_name, nif, email, iban, hire_date, status')
    .eq('organization_id', orgId)
    .order('person_name', { ascending: true })
  if (error) throw error

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Empleados</h1>
      <div className="grid gap-2">
        {employees?.map(e => (
          <div key={e.id} className="border rounded-xl p-3">
            <div className="font-medium">{e.person_name}</div>
            <div className="text-sm text-gray-500">{e.nif} · {e.email}</div>
            <div className="text-sm">Alta: {e.hire_date ?? '—'} · Estado: {e.status}</div>
          </div>
        )) ?? <div>Sin empleados</div>}
      </div>
    </div>
  )
}
