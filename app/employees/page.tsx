import BackButton from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import DepartmentSelect from "@/components/employees/DepartmentSelect";

export const dynamic = "force-dynamic";

// Helpers para no depender de columnas concretas
function displayName(e: any) {
  const byParts = [e.first_name, e.last_name].filter(Boolean).join(" ");
  return (e.full_name || e.name || byParts || e.email || "—") as string;
}
function displayPosition(e: any) {
  return (e.position || e.job_title || e.cargo || "—") as string;
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams?: { q?: string; department?: string };
}) {
  const supabase = getSupabaseServerClient();
  await requireUser(); // 🔐 asegura sesión (RLS funciona)

  const q = (searchParams?.q ?? "").trim().toLowerCase();
  const filterDept = (searchParams?.department ?? "").trim();

  // Departamentos
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name", { ascending: true });

  // ❗️Sin filtros de user_id: dejamos que RLS devuelva lo permitido
  let empQuery = supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });

  if (filterDept) empQuery = empQuery.eq("department_id", filterDept);

  const { data: rawEmployees, error } = await empQuery;

  // Búsqueda por nombre
  const employees = (rawEmployees ?? []).filter((e) =>
    q ? displayName(e).toLowerCase().includes(q) : true
  );

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <BackButton />
        <h1 className="text-xl font-semibold text-slate-900">Empleados</h1>
        <a
          href="/employees/new"
          className="inline-flex items-center gap-2 rounded-md bg-clientum-blue hover:bg-clientum-blueDark text-white px-3 py-2 text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M12 5v14M5 12h14"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Nuevo
        </a>
      </div>

      {/* Filtros */}
      <Card className="shadow-clientum mb-4">
        <CardContent className="p-4">
          <form className="flex flex-col md:flex-row items-center gap-3">
            <Input
              name="q"
              placeholder="Buscar por nombre…"
              defaultValue={searchParams?.q ?? ""}
              className="w-full md:w-64"
            />
            <select
              name="department"
              defaultValue={filterDept}
              className="border rounded-md px-2 py-2 text-sm bg-white"
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
                employees.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      <div>{displayName(e)}</div>
                      <div className="text-xs text-slate-500">{e.email ?? ""}</div>
                    </TableCell>
                    <TableCell>{displayPosition(e)}</TableCell>
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
