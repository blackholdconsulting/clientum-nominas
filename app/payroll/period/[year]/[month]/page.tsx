// app/payroll/period/[year]/[month]/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { generateDraft } from "./actions"; // tu server action que llama al RPC
// Opcional, evita caché en este endpoint:
export const dynamic = "force-dynamic";

type Props = {
  params: { year: string; month: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">
        Crear nómina {/** muestra periodo **/}
      </h1>
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
        <div className="font-medium mb-1">No se pudo crear el borrador</div>
        <div className="text-sm">{message}</div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href="?create=1"
          className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Reintentar creación
        </Link>
        <Link
          href="/payroll"
          className="inline-flex items-center rounded border px-4 py-2 hover:bg-gray-50"
        >
          Volver a la lista
        </Link>
      </div>
    </div>
  );
}

export default async function PayrollPeriodPage({ params, searchParams }: Props) {
  const year = Number(params.year);
  const month = Number(params.month);
  const shouldCreate = searchParams?.create === "1";

  if (shouldCreate) {
    try {
      const res = await generateDraft(year, month);
      if (!res?.ok || !res?.payroll_id) {
        throw new Error("Respuesta inválida del generador de nóminas.");
      }
      // IMPORTANTE: no atrapar este redirect.
      redirect(`/payroll/${res.payroll_id}/edit`);
    } catch (err: any) {
      // <== ESTA ES LA CLAVE
      // Cuando Next hace redirect lanza una excepción con digest === 'NEXT_REDIRECT'.
      // Re-lanzamos esa excepción para que Next redirija correctamente.
      if (err?.digest === "NEXT_REDIRECT") {
        throw err;
      }
      // Errores reales → mostramos UI de error
      return <ErrorBox message={err?.message ?? "Error desconocido"} />;
    }
  }

  // Si no venimos con ?create=1, puedes mostrar un estado neutro / botón crear:
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">
        Editor de nómina {month}/{year}
      </h1>
      <div className="rounded border p-4">
        <p className="mb-4">Aún no existe borrador para este periodo.</p>
        <Link
          href="?create=1"
          className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Crear borrador de nómina
        </Link>
      </div>
      <div className="mt-4">
        <Link href="/payroll" className="text-sm underline">
          Volver
        </Link>
      </div>
    </div>
  );
}
