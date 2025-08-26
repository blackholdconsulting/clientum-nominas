// app/payroll/period/[year]/[month]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type Params = { year: string; month: string };
type Search = { create?: string };

async function createDraft(year: number, month: number) {
  // Crear el borrador en Supabase llamando a tu RPC/función SQL
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // ⚠️ Ajusta el nombre y parámetros del RPC a los tuyos si difieren
  const { error } = await supabase.rpc("payroll_generate_period", {
    p_year: year,
    p_month: month,
  });

  if (error) {
    // Si la función ya existe y hace "insert if not exists",
    // podrías ignorar el error; aquí lo lanzamos para ver el motivo.
    throw new Error(error.message);
  }
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

  // Si viene ?create=1, creamos el borrador y volvemos al editor del periodo (URL relativa)
  if (searchParams?.create === "1") {
    await createDraft(year, month);
    redirect(`/payroll/period/${year}/${month}`);
  }

  // Render muy sencillo de ejemplo: muestra botón para crear borrador
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">
        Editor de nómina {month}/{year}
      </h1>

      {/* Si no hay nómina, mostramos el CTA para crearla */}
      <div className="rounded-md border bg-amber-50 p-4 mb-6">
        <p className="mb-3">
          Aún no existe una nómina para este periodo.
        </p>
        <Link
          href={`/payroll/period/${year}/${month}?create=1`}
          replace
          className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
        >
          Crear borrador de nómina
        </Link>
      </div>

      {/* Aquí pondrás el editor de líneas por empleado cuando exista */}
      <p className="text-sm text-muted-foreground">
        Cuando exista la nómina, aquí se mostrará el editor por empleado y el
        histórico del periodo.
      </p>
    </main>
  );
}
