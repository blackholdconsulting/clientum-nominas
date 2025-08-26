import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type Params = { year: string; month: string };
type Search = { create?: string };

async function createDraft(year: number, month: number) {
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

  // ⚠️ Ajusta el nombre/params del RPC a los tuyos si difieren
  const { error } = await supabase.rpc("payroll_generate_period", {
    p_year: year,
    p_month: month,
  });

  if (error) throw new Error(error.message);
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

  // 1) Si viene ?create=1 -> crea el borrador y vuelve al editor del mismo periodo
  if (searchParams?.create === "1") {
    await createDraft(year, month);
    redirect(`/payroll/period/${year}/${month}`);
  }

  // 2) Si NO hay nómina, muestra CTA para crearla
  //    (Aquí normalmente consultarías si existe; de momento mostramos CTA simple)
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">
        Editor de nómina {month}/{year}
      </h1>

      <div className="rounded-md border bg-amber-50 p-4 mb-6">
        <p className="mb-3">Aún no existe una nómina para este periodo.</p>
        <Link
          href={`/payroll/period/${year}/${month}?create=1`}
          replace
          className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
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
