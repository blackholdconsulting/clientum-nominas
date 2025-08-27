"use client";

type Org = { id: string; name: string };

export default function OrgPickerModal({
  open,
  orgs,
  onCancel,
  onConfirm,
  title = "Selecciona organización",
}: {
  open: boolean;
  orgs: Org[];
  onCancel: () => void;
  onConfirm: (id: string) => void;
  title?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="w-[420px] rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-xs text-gray-500">
          Tu usuario pertenece a varias organizaciones. Elige con cuál crear la nómina.
        </p>

        <div className="mt-4">
          <label className="block text-xs text-gray-600">Organización</label>
          <select
            id="org-picker"
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) onConfirm(v);
            }}
          >
            <option value="" disabled>
              Selecciona…
            </option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onCancel}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
