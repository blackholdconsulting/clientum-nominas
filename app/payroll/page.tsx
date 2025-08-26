// app/payroll/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function esMonthName(m: number) {
  const months = [
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre",
  ];
  return months[m - 1];
}

export default async function PayrollHome({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: () => cookieStore }
  );

  // Año seleccionado (por defecto, el actual)
  const now = new Date();
  const selectedYear =
    Number(searchParams?.year ?? now.getFullYear());

  // (Opcional) puedes calcular métricas reales si quieres
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .single();

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Gestión de nóminas
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Administra, genera y revisa las nóminas por periodo.
          </p>
        </div>

        {/* Selector simple del año (si quieres hacerlo interactivo, usa client component) */}
        <div className="text-right">
          <div className="text-sm text-gray-600">Año</div>
          <div className="text-lg font-medium">
            {selectedYear}
          </div>
        </div>
      </div>

      {/* Tarjetas resumen (simples) */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-600">Bruto acumulado</div>
          <div className="mt-1 text-2xl font-semibold">0,00 €</div>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-600">Neto acumulado</div>
          <div className="mt-1 text-2xl font-semibold">0,00 €</div>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-600">Nóminas finalizadas</div>
          <div className="mt-1 text-2xl font-semibold">0 / 12</div>
        </div>
      </div>

      {/* Cuadrícula de meses */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
          <div
            key={month}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-500">
                  Mes
                </div>
                <div className="text-lg font-semibold">
                  {esMonthName(month)} {selectedYear}
                </div>
              </div>

              {/* Totales del mes (placeholders) */}
              <div className="text-right">
                <div className="text-xs text-gray-500">Bruto</div>
                <div className="text-sm font-medium">0,00 €</div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              Sin nómina
            </div>

            <div className="mt-4">
              {/* IMPORTANTE: abre /payroll/editor en una pestaña nueva */}
              <Link
                href={{
                  pathname: "/payroll/editor",
                  query: { year: selectedYear, month },
                }}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none"
              >
                Editar nómina
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
