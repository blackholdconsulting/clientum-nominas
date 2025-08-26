// app/payroll/page.tsx
import Link from "next/link";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function PayrollHome() {
  const year = new Date().getFullYear();

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">Gestión de Nóminas</h1>
      <p className="text-muted-foreground mb-8">
        Selecciona un período para preparar las nóminas de tus empleados.
      </p>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {MONTHS.map((label, idx) => {
          const month = idx + 1;
          const href = `/payroll/editor/page

          return (
            <section
              key={month}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <header className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">{label}</h3>
                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                  {String(month).padStart(2, "0")}/{year}
                </span>
              </header>

              <p className="text-sm text-gray-600 mb-4">
                Prepara, revisa y guarda las nóminas de tu equipo para este mes.
              </p>

              <div className="pt-2">
                <Link
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                  className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Editar nómina
                </Link>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
