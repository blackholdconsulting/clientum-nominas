// app/payroll/period/[year]/[month]/page.tsx
export const runtime = "nodejs";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";

type Params = { params: { year: string; month: string } };

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

export default async function PayrollEditorPage({ params }: Params) {
  const year = Number(params.year);
  const month = Number(params.month);
  const supabase = getSupabase();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Editor de nómina {month}/{year}</h1>
        <p className="mt-4 text-red-600">Debes iniciar sesión.</p>
        <Link className="text-blue-600 underline mt-2 inline-block" href="/login">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  // ¿Existe la cabecera?
  const { data: payroll, error: pErr } = await supabase
    .from("payrolls")
    .select("id, status, gross_total, net_total")
    .eq("user_id", user.id)
    .eq("period_year", year)
    .eq("period_month", month)
    .maybeSingle();
  if (pErr) throw pErr;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">
        Editor de nómina {new Date(year, month - 1).toLocaleString("es-ES", { month: "long" })} {year}
      </h1>

      {!payroll ? (
        <div className="mt-6 border border-yellow-300 bg-yellow-50 p-5 rounded">
          <p className="mb-4">Aún no existe una nómina para este periodo.</p>
          <form action="/api/payroll/generate" method="POST">
            <input type="hidden" name="year" value={year} />
            <input type="hidden" name="month" value={month} />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Crear borrador de nómina
            </button>
          </form>
          <Link href="/payroll" className="mt-4 inline-block text-blue-600 underline">
            Volver
          </Link>
        </div>
      ) : (
        <section className="mt-6 space-y-6">
          {/* Carga y muestra líneas por empleado */}
          <EditorBody payrollId={payroll.id} year={year} month={month} />
        </section>
      )}
    </div>
  );
}

async function EditorBody({ payrollId, year, month }: { payrollId: string; year: number; month: number }) {
  const supabase = getSupabase();

  // Empleados + líneas
  const { data: rows, error: rErr } = await supabase
    .from("payroll_items")
    .select("employee_id, base_gross, irpf_amount, ss_emp_amount, ss_er_amount, net, employees(full_name)")
    .eq("payroll_id", payrollId);
  if (rErr) throw rErr;

  if (!rows?.length) {
    return <p className="text-gray-600">No hay líneas aún para este periodo.</p>;
  }

  return (
    <div className="border rounded p-4">
      <p className="text-sm text-gray-600 mb-3">
        Periodo: {month}/{year} — Empleados: {rows.length}
      </p>
      <div className="space-y-3">
        {rows.map((r: any) => (
          <div key={r.employee_id} className="grid grid-cols-6 gap-3 items-center border-b pb-2">
            <div className="col-span-2 font-medium">{r.employees?.full_name ?? r.employee_id}</div>
            <div>Bruto: {Number(r.base_gross).toFixed(2)} €</div>
            <div>IRPF: {Number(r.irpf_amount).toFixed(2)} €</div>
            <div>SS Trab.: {Number(r.ss_emp_amount).toFixed(2)} €</div>
            <div>NETO: {Number(r.net).toFixed(2)} €</div>
          </div>
        ))}
      </div>
    </div>
  );
}
