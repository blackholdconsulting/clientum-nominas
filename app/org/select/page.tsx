import { getUserMemberships, setActiveOrgId } from '@/lib/org'
import { redirect } from 'next/navigation'

export default async function OrgSelectPage() {
  const memberships = await getUserMemberships()
  if (!memberships.length) {
    return <div className="p-8">No tienes organizaciones asignadas.</div>
  }
  return (
    <div className="p-8 space-y-4 max-w-lg">
      <h1 className="text-2xl font-semibold">Selecciona empresa</h1>
      <form action={async (formData: FormData) => {
        'use server'
        const id = String(formData.get('org') || '')
        if (id) await setActiveOrgId(id)
        redirect('/')
      }}>
        <select name="org" className="border rounded p-2 w-full">
          {memberships.map(m => (
            <option key={m.organization_id} value={m.organization_id}>{m.name}</option>
          ))}
        </select>
        <button className="mt-4 px-4 py-2 rounded bg-black text-white">Entrar</button>
      </form>
    </div>
  )
}
