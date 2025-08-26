// app/payroll/period/[year]/[month]/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";
import { createDraftPayroll } from "./actions";

export const runtime = "nodejs";            // <- evita Edge
export const dynamic = "force-dynamic";     // <- evita caching agresivo

type Params = { year: string; month: string };

function getSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          cookieStore.set({ name, value, ...options });
        },
        remove: (name: string, options: any) => {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

async function getData(year: number, month: number) {
  const supabase = getSupabase();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) {
    return { user: null, payroll: null, items: [], employees: [] as any[] };
  }

  // 1) Nómina (cabecera) del periodo (si existe)
  const { data: payroll, error: pErr } = await supabase
    .from("payrolls")
    .select("*")
    .eq("user_id", user.id)
    .eq("period_year", year)
    .eq("period_month", month)
    .maybeSingle(); // <- nunca lanza si 0 filas
  if (pErr) throw pErr;

  // 2) Empleados del usuario
  const { data: employees, error: eErr } = await supabase
    .from("employees")
    .select("id, full_name, email, position")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (eErr) throw eErr;

  // 3) Items (si hay cabecera)
  let items: any[] = [];
  if (payroll?.id) {
    const { data: iData, error: iErr } = await supabase
      .from("payroll_items")
      .select(
        "id, employee_id, base_gross, irpf_amount, ss_emp_amount, ss_er_amount, net"
      )
      .eq("payroll_id", payroll.id)
      .order("created_at", { ascending: true });
    if (iErr) throw iErr;
    items = iData ?? [];
  }

  return { user, payroll, items, employees };
}

export default async function PayrollEditorPage({ params }: { params: Params }) {
  const year = Number(params.year);
  const month = Number(params.month);

  const { user, payroll, items, employees } = await getData(year, month);

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-xl font-semibold mb-4">
          Editor de nómina {month}/{year}
        </h1>
        <p className="text-red-600 mb-4">Debes iniciar sesión.</p>
        <Link href="/" className="text-blue-600 underline">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">
        Editor de nómina {month}/{year}
      </h1>

      {!payroll ? (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4">
          <p className="mb-4">
            Aún no existe una nómina para este período.
          </p>
          <form action={createDraftPayroll}>
            <input type="hidden" name="year" value={year} />
            <input type="hidden" name="month" value={month} />
            <button
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              type="submit"
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
        <div className="space-y-6">
          <div className="rounded border p-4">
            <p className="text-sm text-gray-500 mb-2">
              Nómina #{payroll.id} — estado: {payroll.status ?? "draft"}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h2 className="font-medium mb-2">Empleados en este periodo</h2>
                {employees.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No tienes empleados creados.
                  </p>
                ) : (
                  <ul className="list-disc list-inside text-sm">
                    {employees.map((e) => (
                      <li key={e.id}>
                        {e.full_name} <span className="text-gray-500">({e.email})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h2 className="font-medium mb-2">Líneas de nómina</h2>
                {items.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Aún no hay líneas. Si acabas de crear el borrador, recarga o vuelve
                    atrás y entra de nuevo.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-1">Empleado</th>
                        <th className="py-1">Bruto</th>
                        <th className="py-1">IRPF</th>
                        <th className="py-1">SS Emp</th>
                        <th className="py-1">SS Empre</th>
                        <th className="py-1">Neto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => {
                        const emp = employees.find((e) => e.id === it.employee_id);
                        return (
                          <tr key={it.id} className="border-b">
                            <td className="py-1">{emp?.full_name ?? it.employee_id}</td>
                            <td className="py-1">{Number(it.base_gross ?? 0).toFixed(2)} €</td>
                            <td className="py-1">{Number(it.irpf_amount ?? 0).toFixed(2)} €</td>
                            <td className="py-1">{Number(it.ss_emp_amount ?? 0).toFixed(2)} €</td>
                            <td className="py-1">{Number(it.ss_er_amount ?? 0).toFixed(2)} €</td>
                            <td className="py-1">{Number(it.net ?? 0).toFixed(2)} €</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          <div>
            <Link href="/payroll" className="text-blue-600 underline">
              Volver
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
