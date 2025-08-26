// app/payroll/period/[year]/[month]/page.tsx
import Link from "next/link";
import { createSupabaseServer } from "@/utils/supabase/server"; // <-- usa tu helper real
import { createDraftPayroll } from "./actions";

type PageProps = {
  params: { year: string; month: string };
};

function titleMonth(year: number, month: number) {
  const m = new Date(year, month - 1, 1).toLocaleDateString("es-ES", {
    month: "long",
  });
  return `${m} ${year}`; // p.ej. "agosto 2025"
}

export default async function PeriodEditorPage({ params }: PageProps) {
  const year = Number(params.year);
  const month = Number(params.month);

  const supabase = createSupabaseServer();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="mb-4 text-xl font-semibold">
          Editor de nómina {month}/{year}
        </h1>
        <p className="text-red-600">No hay sesión iniciada.</p>
        <Link href="/payroll" className="mt-4 inline-block text-blue-600 underline">
          Volver
        </Link>
      </div>
    );
  }

  // ⚠️ Usamos maybeSingle para que NO reviente cuando no hay fila
  const { data: payroll, error } = await supabase
    .from("payrolls")
    .select("id, status, period_year, period_month")
    .eq("user_id", user.id)
    .eq("period_year", year)
    .eq("period_month", month)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">
        Editor de nómina {titleMonth(year, month)}
      </h1>

      {/* Estado vacío: no hay nómina creada aún */}
      {!payroll ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4">
          <p className="mb-3 text-amber-800">
            Aún no existe una nómina para este periodo.
          </p>
          <form action={createDraftPayroll}>
            {/* Pasamos el periodo a la Action */}
            <input type="hidden" name="year" value={year} />
            <input type="hidden" name="month" value={month} />
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Crear borrador de nómina
            </button>
          </form>

          <div className="mt-4">
            <Link href="/payroll" className="text-blue-600 underline">
              Volver
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Aquí renderiza tu editor real. 
              De momento dejamos un “placeholder” con info mínima. */}
          <div className="mb-6 rounded-md border bg-white p-4">
            <p className="text-sm text-gray-600">ID: {payroll.id}</p>
            <p className="text-sm text-gray-600">Estado: {payroll.status ?? "draft"}</p>
          </div>

          {/* Ejemplo: contenedor de pestañas, toolbar, etc. */}
          <div className="rounded-md border bg-white p-4">
            <p className="text-gray-800">
              Aquí va el <strong>editor por empleado</strong>, líneas de nómina,
              totales, etc.
            </p>
          </div>

          <div className="mt-6">
            <Link href="/payroll" className="text-blue-600 underline">
              Volver a la lista de meses
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
