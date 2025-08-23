import { cookies } from 'next/headers'
import { supabaseServer } from './supabase/server'

const ORG_COOKIE = 'clientum_active_org'

export async function getActiveOrgId() {
  const c = await cookies()
  const id = c.get(ORG_COOKIE)?.value
  return id || null
}

export async function setActiveOrgId(orgId: string) {
  const c = await cookies()
  c.set(ORG_COOKIE, orgId, { path: '/', httpOnly: true, sameSite: 'lax' })
}

export async function getUserMemberships() {
  const { supabase, user } = await (await import('./auth')).requireUser()
  const { data, error } = await supabase
    .from('core.memberships')
    .select('organization_id, role, core.organizations(id, name)')
    .eq('user_id', user.id)
  if (error) throw error
  return data?.map(m => ({
    organization_id: m.organization_id,
    role: m.role,
    name: (m as any).core?.organizations?.name ?? 'Empresa'
  })) ?? []
}
