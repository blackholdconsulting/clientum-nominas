// app/contracts/models/[key]/form-client.tsx
'use client';

import { useState } from 'react';

type Field =
  | { name: string; label: string; type: 'text' | 'textarea' | 'date' | 'number'; optional?: boolean }
  | { name: string; label: string; type: 'select'; options: string[]; optional?: boolean };

export default function FormClient({
  templateKey,
  fields,
  employees
}: {
  templateKey: string;
  fields: Field[];
  employees: { id: string; first_name: string; last_name: string }[];
}) {
  const [employeeId, setEmployeeId] = useState('');
  const [values, setValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onChange = (name: string, v: any) => setValues((s) => ({ ...s, [name]: v }));

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const res = await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ template: templateKey, employee_id: employeeId, data: values })
    });
    const j = await res.json();
    setSaving(false);
    if (!res.ok) return setMsg(j.error || 'Error guardando');
    setMsg('Guardado como borrador ✔');
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Empleado</label>
        <select
          className="w-full rounded-md border px-3 py-2"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        >
          <option value="">Selecciona…</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.first_name} {e.last_name}
            </option>
          ))}
        </select>
      </div>

      {fields.map((f) => (
        <div key={f.name}>
          <label className="mb-1 block text-sm font-medium">{f.label}</label>
          {f.type === 'textarea' ? (
            <textarea className="w-full rounded-md border px-3 py-2"
              onChange={(e) => onChange(f.name, e.target.value)} />
          ) : f.type === 'select' ? (
            <select className="w-full rounded-md border px-3 py-2"
              onChange={(e) => onChange(f.name, e.target.value)}>
              <option value="">Selecciona…</option>
              {(f as any).options.map((o: string) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input
              type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
              className="w-full rounded-md border px-3 py-2"
              onChange={(e) => onChange(f.name, e.target.value)}
            />
          )}
        </div>
      ))}

      <button
        disabled={saving || !employeeId}
        onClick={save}
        className="rounded-md bg-emerald-700 px-4 py-2 text-white disabled:opacity-50"
      >
        {saving ? 'Guardando…' : 'Guardar borrador'}
      </button>

      {msg && <div className="text-sm text-gray-600">{msg}</div>}
    </div>
  );
}
