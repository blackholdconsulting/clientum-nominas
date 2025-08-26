// app/payroll/page.tsx
import Link from "next/link";

type Search = { year?: string };

const MONTHS = [
  { n: 1, name: "Enero" },
  { n: 2, name: "Febrero" },
  { n: 3, name: "Marzo" },
  { n: 4, name: "Abril" },
  { n: 5, name: "Mayo" },
  { n: 6, name: "Junio" },
  { n: 7, name: "Julio" },
  { n: 8, name: "Agosto" },
  { n: 9, name: "Septiembre" },
  { n: 10, name: "Octubre" },
  { n: 11, name: "Noviembre" },
  { n: 12, name: "Diciembre" },
];

export default function PayrollPage({ searchParams }: { searchParams?: Search }) {
  const year = Number(searchParams?.year ?? new Date().getFullYear()) || new Date().getFullYear();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Gestión de Nóminas</h1>
        <p className="text-sm text-muted-foreground">
          Administra, genera y revisa las nóminas por periodo.
        </p>

        <div className="mt-4 inline-flex items-center gap-2">
          <span className="text-sm">Año:</span>
          <form className="inline-flex items-center gap-2">
            <input
              type="number"
              name="year"
              defaultValue={year}
              className="w-24 rounded-md border px-2 py-1 text-sm"
              min={2000}
              max={9999}
            />
            <button className="rounded-md bg-neutral-900 text-white px-3 py-1 text-sm">
              Cambiar
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {MONTHS.map((m) => (
          <div key={m.n} className="rounded-lg border p-4 flex flex-col justify-between">
            <div className="mb-4">
              <div className="text-lg font-medium">{m.name}</div>
              <div className="mt-2 text-sm text-muted-foreground">Sin nómina</div>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">BRUTO</div>
                  <div className="font-semibold">0,00 €</div>
                </div>
                <div>
                  <div className="text-muted-foreground">NETO</div>
                  <div className="font-semibold">0,00 €</div>
                </div>
              </div>
            </div>

            {/* Este botón abre SIEMPRE el editor en nueva pestaña */}
            <Link
              href={`/payroll/period/${year}/${m.n}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
            >
              Editar nómina
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
