import { cookies } from 'next/headers'
import { requireUser } from './auth'

const ORG_COOKIE = 'clientum_active_org'

export async function getActiveOrgId() {
  const c = await cookies()
  return c.get(ORG_COOKIE)?.value ?? null
}

export async function setActiveOrgId(orgId: string) {
  const c = await cookies()
  c.set(ORG_COOKIE, orgId, { path: '/', httpOnly: true, sameSite: 'lax' })
}

export async function getUserMemberships() {
  const { supabase, user } = await requireUser()
  const { data, error } = await supabase
    .from('core.memberships')
    .select('organization_id, role, core:core.organizations(id,name)')
    .eq('user_id', user.id)
  if (error) throw error
  return (data ?? []).map((m: any) => ({
    organization_id: m.organization_id,
    role: m.role,
    name: m.core?.name ?? 'Empresa'
  }))
}
