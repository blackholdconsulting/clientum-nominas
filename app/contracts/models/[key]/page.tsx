// app/contracts/models/[key]/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

type Props = { params: { key: string } };

export default async function ContractTemplatePage({ params }: Props) {
  const supabase = supabaseServer();

  // Asegura el nombre original del fichero (espacios, etc.)
  const key = decodeURIComponent(params.key);

  // Confirmar que el archivo existe listándolo (opcional, pero útil)
  const { data: list, error: listErr } = await supabase
    .storage
    .from("contract-templates")
    .list("", { search: key });

  if (listErr) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold mb-2">Plantilla</h1>
        <p className="text-red-600">Error: {listErr.message}</p>
      </div>
    );
  }

  const exists = (list ?? []).some(f => f.name === key);
  if (!exists) return notFound();

  // URL firmada para previsualizar
  const { data: signed, error: sigErr } = await supabase
    .storage
    .from("contract-templates")
    .createSignedUrl(key, 60 * 10); // 10 min

  if (sigErr || !signed?.signedUrl) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold mb-2">Plantilla</h1>
        <p className="text-red-600">No se pudo generar la URL firmada.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Plantilla: {key}</h1>

      <div className="rounded-md border overflow-hidden">
        <iframe
          src={signed.signedUrl}
          className="w-full h-[80vh]"
          title={`Plantilla ${key}`}
        />
      </div>

      {/* Aquí después añadimos el botón "Rellenar/Editar" → abre un editor y luego guarda en `public.contracts` */}
    </div>
  );
}
