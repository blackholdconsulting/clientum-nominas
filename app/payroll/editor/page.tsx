// app/payroll/editor/page.tsx
import { cookies } from "next/headers";
import Link from "next/link";
import { createServerClient } from "@supabase/ssr";

function monthNameEs(m: number) {
  const arr = [
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre",
  ];
  return arr[m - 1];
}

export default async function PayrollEditor({
  searchParams,
}: {
  searchParams: { year?: string; month?: string };
}) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: () => cookieStore }
  );

  // Parámetros
  const now = new Date();
  const year = Number(searchParams?.year ?? now.getFullYear());
  const month = Math.max(1, Math.min(12, Number(searchParams?.month ?? (now.getMonth() + 1))));

  // 1) Averiguamos el org_id del usuario actual
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id")
    .single();

  let orgId: string | null = profile?.org_id ?? null;

  if (!orgId && profile?.id) {
    // Fallback a org_members (por si manejas multi-org)
    const { data: member } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", profile.id)
      .limit(1)
      .maybeSingle();
    orgId = member?.org_id ?? null;
  }

  // 2) Empleados del cliente (primero mira vista segura, luego tabla)
  let employees: Array<{
    id?: string;
    uuid?: string;
    full_name?: string | null;
    nif?: string | null;
    category?: string | null;
  }> = [];

  // a) Si tienes la vista v_my_employees (recomendada)
  const { data: vEmp, error: vErr } = await supabase
    .from("v_my_employees")
    .select("id, uuid, full_name, nif, category");

  if (!vErr && vEmp) {
    employees = vEmp;
  } else {
    // b) Fallback a employees con filtro por org (requiere RLS o políticas)
    if (!orgId) {
      // Si no hay orgId, no mostramos empleados
      employees = [];
    } else {
      const { data: emp2 } = await supabase
        .from("employees")
        .select("id, uuid, full_name, nif, category, org_id")
        .eq("org_id", orgId);
      employees = emp2 ?? [];
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Encabezado */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Editor de nómina {String(month).padStart(2, "0")}/{year}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Aquí podrás preparar las nóminas de todos los empleados de tu
            empresa para el periodo seleccionado.
          </p>
        </div>

        <Link
          href="/payroll"
          className="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Volver a la lista
        </Link>
      </div>

      {/* Aviso */}
      <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        El editor ya está operativo. Conecta aquí tu carga de empleados y líneas
        de nómina. Para empezar, crea o reutiliza un borrador del periodo{" "}
        <strong>
          {monthNameEs(month)} {year}
        </strong>{" "}
        y añade las partidas por empleado.
      </div>

      {/* Grid de empleados */}
      {employees.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-gray-600">
          No se han encontrado empleados para tu organización.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {employees.map((e, idx) => (
            <div key={e.uuid ?? e.id ?? idx} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="mb-1 text-sm text-gray-500">
                Empleado
              </div>
              <div className="mb-2 text-lg font-semibold">
                {e.full_name ?? `Empleado ${idx + 1}`}
              </div>

              <div className="text-sm text-gray-600">
                <div>
                  <span className="font-medium">NIF: </span>{e.nif ?? "—"}
                </div>
                <div>
                  <span className="font-medium">Categoría: </span>{e.category ?? "—"}
                </div>
              </div>

              {/* Aquí podrías listar/editar conceptos de payroll_items del periodo */}
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Conceptos (ejemplo)</div>
                  <div className="text-xs text-gray-500">
                    {monthNameEs(month)} {year}
                  </div>
                </div>
                <ul className="mt-2 list-disc pl-5">
                  <li>Salario base — … €</li>
                  <li>Plus transporte — … €</li>
                </ul>
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="inline-flex items-center rounded-lg border bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Ver detalle
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
