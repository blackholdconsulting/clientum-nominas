// app/contracts/models/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export default async function ContractModelsPage() {
  const supabase = supabaseServer();

  // Listar plantillas del bucket contract-templates
  const { data, error } = await supabase
    .storage
    .from("contract-templates")
    .list("", { limit: 100, sortBy: { column: "name", order: "asc" } });

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold mb-2">Plantillas de contrato</h1>
        <p className="text-red-600">Error al cargar: {error.message}</p>
      </div>
    );
  }

  const files = (data ?? []).filter(f => !f.name.startsWith("."));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Modelos oficiales</h1>

      {files.length === 0 ? (
        <p className="text-muted-foreground">No hay plantillas cargadas.</p>
      ) : (
        <ul className="space-y-3">
          {files.map((f) => (
            <li key={f.name} className="border rounded-md p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{f.name}</p>
                <p className="text-sm text-muted-foreground">Plantilla oficial en PDF</p>
              </div>
              <Link
                href={`/contracts/models/${encodeURIComponent(f.name)}`}
                className="inline-flex items-center rounded-md bg-emerald-700 text-white px-4 py-2 hover:bg-emerald-800"
              >
                Usar plantilla
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
