// app/contracts/models/page.tsx
import { getSupabaseServerClient } from "@/lib/supabase/server"; // lee cookies, no setea
import Link from "next/link";

export const revalidate = 0; // SSR puro

export default async function ContractModelsPage() {
  const supabase = getSupabaseServerClient();

  // lee plantillas públicas desde storage o una tabla de metadatos
  // ejemplo si usas tabla contract_templates:
  const { data, error } = await supabase
    .from("contract_templates")
    .select("key,label,category,version")
    .order("category", { ascending: true })
    .order("label", { ascending: true });

  if (error) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Plantillas de contrato</h1>
        <p className="text-red-600">
          Error al cargar: {error.message}
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Plantillas de contrato</h1>
      <ul className="space-y-2">
        {data?.map((tpl) => (
          <li key={tpl.key} className="border p-3 rounded">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{tpl.label}</div>
                <div className="text-sm text-muted-foreground">
                  {tpl.category} · v{tpl.version ?? "1"}
                </div>
              </div>
              <Link
                className="px-3 py-1 rounded bg-primary text-primary-foreground"
                href={`/contracts/models/${encodeURIComponent(tpl.key)}`}
              >
                Abrir
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
