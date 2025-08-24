// app/contracts/models/page.tsx
import { supabaseServer } from '@/lib/supabase/server'; // ajusta al helper de tu repo
import Link from 'next/link';

export default async function ModelsPage() {
  const supabase = supabaseServer();
  const { data: templates, error } = await supabase
    .from('contract_templates')
    .select('key, name, category, pdf_path')
    .order('name');

  if (error) {
    return <div className="p-6 text-red-600">Error cargando modelos: {error.message}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Modelos oficiales</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates?.map((t) => (
          <div key={t.key} className="rounded-xl border p-4">
            <div className="mb-2 text-sm text-gray-500">{t.category}</div>
            <div className="font-medium">{t.name}</div>
            <div className="mt-4 flex items-center gap-2">
              <Link
                className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
                href={`/contracts/models/${t.key}`}
              >
                Editar / Rellenar
              </Link>
              <a
                className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
                href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${t.pdf_path}`}
                target="_blank"
              >
                Ver PDF oficial
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
