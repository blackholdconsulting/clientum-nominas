// app/payroll/new/page.tsx
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

// Evita que Next deje esto estático:
export const dynamic = "force-dynamic";
export const revalidate = 0;

type EmployeeRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  position: string | null;        // en tu tabla suele llamarse 'position' o 'puesto'
  department_id: string | null;   // FK opcional
  created_at: string | null;
};

async function loadData() {
  const supabase = createClient(cookies());

  // 1) Usuario autenticado
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    // sin sesión => a login (o donde corresponda)
    redirect("/login");
  }
  const user = userData.user;

  // 2) Empleados del usuario (multi-tenant)
  //    IMPORTANTE: solo columnas que existan realmente en public.employees
  const { data: employees, error: empErr } = await supabase
    .from("employees")
    .select("id, full_name, email, position, department_id, created_at")
    .eq("user_id", user.id)        // <- este es el filtro RLS
    .order("full_name", { ascending: true });

  return {
    userId: user.id,
    employees: (employees ?? []) as EmployeeRow[],
    error: empErr?.message ?? null,
  };
}

export default async function NewPayrollPage() {
  const { userId, employees, error } = await loadData();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      {/* Debug suave (si algo falla verás info en UI) */}
      <div className="sr-only" aria-hidden>
        userId: {userId} | empleados: {employees.length} | error: {error ?? "-"}
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Crear Nueva Nómina</h1>
          <p className="text-sm text-muted-foreground">
            Selecciona a qué empleados incluirás este mes.
          </p>
        </div>

        <Link
          href="/payroll"
          className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          Cancelar
        </Link>
      </div>

      {/* Estado de error duro (SQL/políticas) */}
      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          Error cargando empleados: {error}
        </div>
      )}

      {/* Lista de empleados del tenant */}
      {employees.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No hay empleados para este usuario.
          <div className="mt-2 text-xs opacity-70">
            (uid: <code>{userId}</code>)
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {employees.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <div className="font-medium">{e.full_name ?? "Sin nombre"}</div>
                <div className="text-xs text-muted-foreground">
                  {e.email ?? "Sin email"}
                  {e.position ? ` • ${e.position}` : ""}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Alta: {e.created_at ? new Date(e.created_at).toLocaleString() : "–"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Acciones (placeholder) */}
      {employees.length > 0 && (
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="rounded-md bg-[#1E66FF] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            type="button"
          >
            Procesar Nómina
          </button>
        </div>
      )}
    </main>
  );
}
