import BackButton from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import DepartmentSelect from "@/components/employees/DepartmentSelect";

export const dynamic = "force-dynamic";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: { q?: string; department?: string };
}) {
  const supabase = getSupabaseServerClient();

  // 🔐 Asegura sesión (si no hay, redirige a /auth)
  const user = await requireUser();

  const q = (searchParams?.q ?? "").trim();
  const filterDept = (searchParams?.department ?? "").trim();

  // Departamentos
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name", { ascending: true });

  // Empleados del usuario actual
  // 👉 Mientras haces backfill, permitimos también ver filas sin user_id:
  //    cuando termines el backfill, cambia .or(...) por .eq("user_id", user.id)
  let query = supabase
    .from("employees")
    .select("id, full_name, email, phone, position, department_id, created_at")
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("full_name", `%${q}%`);
  if (filterDept) query = query.eq("department_id", filterDept);

  const { data: employees, error } = await query;

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <BackButton />
        <h1 className="text-xl font-semibold text-slate-900">Empleados</h1>
        <div />
      </div>

      {/* Filtros */}
      <Card className="shadow-clientum mb-4">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <form className="flex items-center gap-2 w-full md:w-auto">
            <Input
              name="q"
              placeholder="Buscar por nombre…"
              defaultValue={q}
              className="w-full md:w-64"
            />
            <select
              name="department"
              defaultValue={filterDept}
              className="border rounded-md px-2 py-1"
            >
              <option value="">Todos los departamentos</option>
              {(departments ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <button className="rounded-md px-3 py-2 bg-clientum-blue hover:bg-clientum-blueDark text-white">
              Filtrar
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="shadow-clientum">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Nombre</TableHead>
                <TableHead>Puesto</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Alta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {error ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-red-600">
                    {error.message}
                  </TableCell>
                </TableRow>
              ) : !employees || employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                    No hay empleados.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      <div>{e.full_name}</div>
                      <div className="text-xs text-slate-500">
                        {e.email ?? ""}
                      </div>
                    </TableCell>
                    <TableCell>{e.position ?? "-"}</TableCell>
                    <TableCell>
                      <DepartmentSelect
                        employeeId={e.id}
                        currentId={e.department_id}
                        departments={(departments ?? []).map((d) => ({
                          id: d.id,
                          name: d.name,
                        }))}
                      />
                    </TableCell>
                    <TableCell>
                      {e.created_at
                        ? new Date(e.created_at as any).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
