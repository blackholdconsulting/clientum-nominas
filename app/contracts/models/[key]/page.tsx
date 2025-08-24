// app/contracts/models/[key]/page.tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createContractFromTemplate } from '@/app/contracts/actions'

type TemplateRow = {
  key: string
  name: string | null
  label: string
  category: string
  version: string
  storage_path: string
}

type EmployeeRow = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

function supabaseServer() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          ),
      },
    },
  )
}

export default async function Page({ params }: { params: { key: string } }) {
  const supabase = supabaseServer()

  // 1) Traer plantilla
  const { data: tpl, error } = await supabase
    .from('contract_templates')
    .select('key,name,label,category,version,storage_path')
    .eq('key', params.key)
    .maybeSingle<TemplateRow>()

  if (error || !tpl) {
    return (
      <div className="max-w-xl mx-auto p-8">
        <div className="rounded-xl border bg-cyan-50 p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Contrato no encontrado</h2>
          <p className="mb-6">
            La plantilla que buscas no existe o ha sido eliminada.
          </p>
          <Link
            className="px-4 py-2 rounded-md bg-teal-900 text-white"
            href="/contracts/models"
          >
            Volver a Plantillas
          </Link>
        </div>
      </div>
    )
  }

  // 2) Empleados del usuario (RLS ya limita por user_id)
  const { data: employees } = await supabase
    .from('employees')
    .select('id, first_name, last_name, email')
    .order('last_name', { ascending: true })
    .returns<EmployeeRow[]>()

  const pdfUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/contract-templates/${tpl.storage_path}`

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{tpl.label}</h1>
          <p className="text-sm text-gray-500">
            {tpl.category} · v{tpl.version}
          </p>
        </div>
        <Link className="text-teal-900 underline" href="/contracts/models">
          ← Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Previsualización del PDF */}
        <div className="rounded-xl border">
          <object
            data={pdfUrl}
            type="application/pdf"
            className="w-full h-[80vh] rounded-xl"
          >
            <iframe src={pdfUrl} className="w-full h-[80vh]" />
          </object>
        </div>

        {/* Formulario para crear contrato */}
        <form
          action={createContractFromTemplate}
          className="rounded-xl border p-6 space-y-4"
        >
          <input type="hidden" name="template_key" value={tpl.key} />

          <div>
            <label className="block text-sm font-medium">Empleado</label>
            <select
              name="employee_id"
              required
              className="mt-1 w-full rounded-md border px-3 py-2"
              defaultValue=""
            >
              <option value="" disabled>
                Selecciona un empleado…
              </option>
              {(employees ?? []).map((e) => (
                <option key={e.id} value={e.id}>
                  {`${e.last_name ?? ''}, ${e.first_name ?? ''}`.trim() ||
                    e.email ||
                    e.id}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Puesto</label>
              <input
                name="position"
                placeholder="Aux. Administrativo"
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Salario (€)</label>
              <input
                name="salary"
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Inicio</label>
              <input
                name="start_date"
                type="date"
                required
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Fin</label>
              <input
                name="end_date"
                type="date"
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Notas</label>
            <textarea
              name="notes"
              rows={4}
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="Observaciones internas…"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-teal-900 text-white"
            >
              Guardar borrador
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
