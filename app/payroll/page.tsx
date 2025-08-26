// app/payroll/page.tsx
import Link from "next/link";

type SearchParams = {
  year?: string;
};

const MESES = [
  { n: 1, nombre: "Enero" },
  { n: 2, nombre: "Febrero" },
  { n: 3, nombre: "Marzo" },
  { n: 4, nombre: "Abril" },
  { n: 5, nombre: "Mayo" },
  { n: 6, nombre: "Junio" },
  { n: 7, nombre: "Julio" },
  { n: 8, nombre: "Agosto" },
  { n: 9, nombre: "Septiembre" },
  { n: 10, nombre: "Octubre" },
  { n: 11, nombre: "Noviembre" },
  { n: 12, nombre: "Diciembre" },
];

function formatEuro(v: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v || 0);
}

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const now = new Date();
  const selectedYear = Number(searchParams?.year ?? now.getFullYear());

  // Si luego quieres traer totales reales por año/mes, aquí puedes hacer tus lecturas a Supabase/DB
  const brutoAcumulado = 0;
  const netoAcumulado = 0;
  const finalizadas = 0; // 0/12

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Cabecera */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Nóminas</h1>
          <p className="text-sm text-gray-500">
            Administra, genera y revisa las nóminas por período.
          </p>
        </div>

        {/* Selector de año (vía query string) */}
        <form method="get" className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Año</label>
          <select
            name="year"
            defaultValue={String(selectedYear)}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 7 }).map((_, i) => {
              const y = now.getFullYear() - 3 + i; // 4 atrás y 3 adelante aprox
              return (
                <option value={y} key={y}>
                  {y}
                </option>
              );
            })}
          </select>
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Cambiar
          </button>
        </form>
      </div>

      {/* Métricas */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Bruto acumulado</p>
          <p className="mt-1 text-2xl font-semibold">{formatEuro(brutoAcumulado)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Neto acumulado</p>
          <p className="mt-1 text-2xl font-semibold">{formatEuro(netoAcumulado)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Nóminas finalizadas</p>
          <p className="mt-1 text-2xl font-semibold">
            {finalizadas}/12
          </p>
        </div>
      </div>

      {/* Tarjetas por mes */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MESES.map((m) => {
          // Si en el futuro calculas totales por mes, sustitúyelos aquí:
          const brutoMes = 0;
          const netoMes = 0;
          const hayNomina = false;

          return (
            <div key={m.n} className="rounded-xl border bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-900">
                  {m.nombre}
                </h3>
                <div className="text-right">
                  <div className="text-xs text-gray-500">BRUTO</div>
                  <div className="text-sm font-semibold">{formatEuro(brutoMes)}</div>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {hayNomina ? "Con nóminas" : "Sin nómina"}
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">NETO</div>
                  <div className="text-sm font-semibold">{formatEuro(netoMes)}</div>
                </div>
              </div>

              {/* 👉 Botón que abre el editor en PESTAÑA NUEVA */}
              <Link
                href={`/payroll/period/${selectedYear}/${m.n}`}
                target="_blank"
                rel="noopener noreferrer"
                prefetch={false}
                className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Editar nómina
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
