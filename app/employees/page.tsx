export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth";

type Emp = {
  id: string;
  full_name: string | null;
  position: string | null;
  start_date: string | null;
  salary_monthly: number | null;
};

export default async function EmployeesPage() {
  // 1) Autenticación (si aquí falla, redirige a /auth; no debería romper SSR)
  let userId = "";
  let errorAuth: string | null = null;
  try {
    const { user } = await requireUser();
    userId = user.id;
  } catch (e: any) {
    errorAuth = e?.message || "Error en requireUser()";
  }

  // Si ni siquiera tenemos userId, mostramos el error.
  if (!userId) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Empleados</h1>
        <p style={{ color: "crimson" }}>
          No hay usuario autenticado. {errorAuth ?? ""}
        </p>
        <p>
          Intenta volver a entrar desde <a href="/auth?next=%2Femployees">/auth</a>.
        </p>
      </main>
    );
  }

  // 2) Consultas a Supabase
  let rows: Emp[] = [];
  let debug: string[] = [];

  // Lazy import para no cargar supabase en el módulo si algo falla antes
  const { supabase } = await requireUser();

  // 2A) Intentar vista de compatibilidad
  try {
    const { data, error } = await supabase
      .from("nominas_employees")
      .select("id, full_name, position, start_date, salary_monthly")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    rows = (data || []) as Emp[];
    debug.push("OK: nominas_employees");
  } catch (e: any) {
    debug.push("Fallo nominas_employees: " + (e?.message || String(e)));

    // 2B) Fallback directo a public.employees con mapeo de columnas
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, position, hired_at, salary")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      rows =
        (data || []).map((r: any) => ({
          id: r.id,
          full_name:
            (r.first_name || "") || (r.last_name || "")
              ? `${r.first_name || ""} ${r.last_name || ""}`.trim()
              : null,
          position: r.position ?? null,
          start_date: r.hired_at ?? null,
          salary_monthly:
            typeof r.salary === "number" ? r.salary : r.salary ? Number(r.salary) : null,
        })) ?? [];

      debug.push("OK: fallback public.employees");
    } catch (e2: any) {
      debug.push("Fallo fallback employees: " + (e2?.message || String(e2)));
      rows = [];
    }
  }

  // 3) Render sencillo y a prueba de errores
  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 12 }}>Empleados</h1>

      {/* Debug visible para diagnosticar en Render */}
      {debug.length > 0 && (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "#f6f8fa",
            padding: 12,
            borderRadius: 6,
            border: "1px solid #e5e7eb",
            marginBottom: 16,
            fontSize: 12,
          }}
        >
          {debug.join("\n")}
        </pre>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <p style={{ color: "#6b7280" }}>
          {rows.length} empleado{rows.length === 1 ? "" : "s"} encontrados
        </p>
        <a
          href="/employees/new"
          style={{
            background: "black",
            color: "white",
            padding: "8px 12px",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          Añadir empleado
        </a>
      </div>

      {rows.length === 0 ? (
        <div
          style={{
            padding: 16,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#f9fafb",
          }}
        >
          No hay empleados. Crea el primero.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "10px 8px" }}>Nombre</th>
                <th style={{ padding: "10px 8px" }}>Puesto</th>
                <th style={{ padding: "10px 8px" }}>Alta</th>
                <th style={{ padding: "10px 8px" }}>Salario (€/mes)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 8px" }}>{e.full_name ?? "—"}</td>
                  <td style={{ padding: "10px 8px" }}>{e.position ?? "—"}</td>
                  <td style={{ padding: "10px 8px" }}>
                    {e.start_date ? new Date(e.start_date).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "10px 8px" }}>
                    {typeof e.salary_monthly === "number"
                      ? e.salary_monthly.toFixed(2)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
