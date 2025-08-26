import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';
import { createDraftPayroll } from './actions';

function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}

type Props = {
  params: { year: string; month: string };
};

export default async function PayrollEditorPage({ params }: Props) {
  const year = Number(params.year);
  const month = Number(params.month);

  const supabase = supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Buscar cabecera (SIN .single() a pelo)
  const { data: payroll, error: payErr } = await supabase
    .from('payrolls')
    .select('id, status, period_year, period_month, gross_total, net_total')
    .eq('period_year', year)
    .eq('period_month', month)
    .eq('user_id', user?.id ?? '')
    .limit(1)
    .maybeSingle();

  const monthName = new Date(year, month - 1, 1).toLocaleDateString('es-ES', {
    month: 'long',
  });

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold mb-6">
        Editor de nómina {monthName} {year}
      </h1>

      {!payroll ? (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4">
          <p className="mb-4">Aún no existe una nómina para este período.</p>

          {/* Botón -> server action */}
          <form action={createDraftPayroll}>
            <input type="hidden" name="year" value={year} />
            <input type="hidden" name="month" value={month} />
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Crear borrador de nómina
            </button>
          </form>

          <div className="mt-4">
            <Link href="/payroll" className="text-indigo-700 hover:underline">
              Volver
            </Link>
          </div>
        </div>
      ) : (
        <section className="space-y-6">
          {/* Cabecera */}
          <div className="rounded-md border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <p className="font-medium">{payroll.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bruto</p>
                <p className="font-medium">{Number(payroll.gross_total).toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Neto</p>
                <p className="font-medium">{Number(payroll.net_total).toFixed(2)} €</p>
              </div>
            </div>
          </div>

          {/* Aquí puedes renderizar la tabla de items de empleados, edición, etc. */}
          <div className="rounded-md border bg-white p-4">
            <p className="text-gray-600">🎛️ Aquí va el editor de líneas por empleado…</p>
          </div>

          <div>
            <Link href="/payroll" className="text-indigo-700 hover:underline">
              Volver
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
