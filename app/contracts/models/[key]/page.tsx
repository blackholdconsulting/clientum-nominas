// app/contracts/models/[key]/page.tsx
import { supabaseServer } from '@/lib/supabase/server';
import FormClient from './form-client';

export default async function ModelEditorPage({ params }: { params: { key: string } }) {
  const supabase = supabaseServer();
  const [{ data: tpl }, { data: employees }] = await Promise.all([
    supabase.from('contract_templates').select('key,name,form_schema').eq('key', params.key).single(),
    supabase.from('employees').select('id, first_name, last_name').order('first_name')
  ]);

  if (!tpl) {
    return (
      <div className="p-6">
        <div className="rounded-xl bg-red-50 p-6 text-red-700">
          Modelo no encontrado
        </div>
      </div>
    );
  }

  const fields = (tpl.form_schema as any)?.fields ?? [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{tpl.name}</h1>
      <FormClient templateKey={tpl.key} fields={fields} employees={employees ?? []} />
    </div>
  );
}
