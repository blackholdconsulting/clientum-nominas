export const dynamic = "force-dynamic";
export const revalidate = 0;

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import EmployeesList from "@/components/payroll/EmployeesList";
import Link from "next/link";

type PageProps = { searchParams?: { year?: string; month?: string; employee?: string } };

function getSupabaseServerSafe() {
  try {
    const cookieStore = cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (!url || !key) return null;
    return createServerClient(url, key, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    });
  } catch { return null; }
}

export default async function PayrollEditorPage({ searchParams }: PageProps) {
  const year = Number(searchParams?.year ?? 0);
  const month = Number(searchParams?.month ?? 0);

  const supabase = getSupabaseServerSafe();
  let period: any = null;
  if (supabase) {
    const { data } = await supabase
      .from("payrolls")
      .select("id, status")
      .eq("year", year)
      .eq("month", month)
      .limit(1)
      .maybeSingle();
    period = data ?? null;
  }

  return (
    <div className="flex h-full">
      {/* Empleados (multi-tenant vía RLS) */}
      <aside className="w-[360px] shrink-0 border-r bg-white">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-gray-800">Empleados</div>
            <div className="text-xs text-gray-500">Multi-tenant (RLS)</div>
          </div>
          <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600">
            {String(month).padStart(2, "0")}/{year}
          </span>
        </div>
        <EmployeesList year={year} month={month} />
      </aside>

      {/* Lienzo de la nómina del empleado (tu editor ya implementado) */}
      <main className="flex flex-1 items-center justify-center bg-gray-50">
        {period ? (
          <div className="text-center text-sm text-gray-600">
            Selecciona un empleado a la izquierda para editar su nómina y generar el PDF.
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-600">No existe período <b>{month}/{year}</b>.</p>
            <button
              onClick={async () => {
                const res = await fetch("/api/payroll/create", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "same-origin",
                  cache: "no-store",
                  body: JSON.stringify({ year, month }),
                });
                const json = await res.json();
                if (res.ok && json.ok) location.reload();
                else alert(json.error ?? "No se ha podido crear el período.");
              }}
              className="mt-3 inline-flex items-center rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1E40AF] px-3.5 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-[#1E40AF]/30"
            >
              Crear período y abrir
            </button>
            <div className="mt-3">
              <Link href="/payroll" className="text-xs text-gray-500 underline hover:text-gray-700">
                Volver a Nóminas
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
