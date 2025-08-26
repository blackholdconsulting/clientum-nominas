/* SERVER COMPONENT */
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// fuerza Node.js y evita caches de server components
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { year: string; month: string };
type Search = { create?: string };

function getSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  );
}

/**
 * Intenta crear el borrador llamando al RPC `payroll_generate_period(p_year int, p_month int)`
 * Si el RPC no existe o falla, muestra el error.
 */
async function createDraftOrThrow(year: number, month: number) {
  const supabase = getSupabaseServer();

  // 1) comprobación de sesión (si tu RPC usa auth.uid())
  const { data: userResp, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw new Error(`auth.getUser(): ${userErr.message}`);
  if (!userResp?.user) throw new Error("No hay sesión iniciada.");

  // 2) intenta el RPC (asegúrate que el nombre y parámetros coinciden)
  const { data, error } = await supabase.rpc("payroll_generate_period", {
    p_year: year,
    p_month: month,
  });

  if (error) {
    // Mensaje explícito del RPC
    throw new Error(`RPC payroll_generate_period: ${error.message}`);
  }

  return data; // id/uuid o lo que devuelva tu RPC
}

export default async function PayrollEditorPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams?: Search;
}) {
  const year = Number(params.year);
  const month = Number(params.month);

  // Si ?create=1 intentar crear y redirigir de nuevo al editor
  if (searchParams?.create === "1") {
    try {
      await createDraftOrThrow(year, month);
      redirect(`/payroll/period/${year}/${month}`);
    } catch (e: any) {
      // Renderiza el error en la página para poder verlo en producción
      const message =
        typeof e?.message === "string" ? e.message : "Error desconocido";
      return (
        <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
          <h1 className="text-2xl font-semibold">
            Crear nómina {month}/{year}
          </h1>

          <div className="rounded-md border border-red-300 bg-red-50 p-4">
            <h2 className="font-medium text-red-800 mb-2">
              No se pudo crear el borrador
            </h2>
            <pre className="whitespace-pre-wrap text-sm text-red-700">
              {message}
            </pre>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/payroll/period/${year}/${month}?create=1`}
              className="inline-flex items-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
            >
              Reintentar creación
            </Link>
            <Link
              href="/payroll"
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm"
            >
              Volver a la lista
            </Link>
          </div>
        </main>
      );
    }
  }

  // Aquí normalmente cargarías la nómina del periodo; de momento mostramos CTA si no existe
  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">
        Editor de nómina {month}/{year}
      </h1>

      <div className="rounded-md border bg-amber-50 p-4">
        <p className="mb-3">Aún no existe una nómina para este periodo.</p>
        <Link
          href={`/payroll/period/${year}/${month}?create=1`}
          className="inline-flex items-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
        >
          Crear borrador de nómina
        </Link>
      </div>

      <p className="text-sm text-muted-foreground">
        Cuando exista la nómina, aquí se mostrará el editor por empleado y el
        histórico del periodo.
      </p>
    </main>
  );
}
