// app/contracts/actions.ts
'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'

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

export async function createContractFromTemplate(formData: FormData) {
  const supabase = supabaseServer()

  const payload = {
    template: String(formData.get('template_key') ?? ''),
    employee_id: String(formData.get('employee_id') ?? ''),
    data: {
      position: formData.get('position') || null,
      salary: formData.get('salary')
        ? Number(formData.get('salary'))
        : null,
      start_date: formData.get('start_date') || null,
      end_date: formData.get('end_date') || null,
      notes: formData.get('notes') || null,
    },
    status: 'borrador' as const,
  }

  if (!payload.template || !payload.employee_id) {
    throw new Error('Faltan datos obligatorios')
  }

  const { data, error } = await supabase
    .from('contracts')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    // Deja que Next muestre el error en la página
    throw new Error(error.message)
  }

  redirect(`/contracts/${data!.id}`)
}
