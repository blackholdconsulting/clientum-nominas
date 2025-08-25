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
import DeleteEmployeeButton from "@/components/employees/DeleteEmployeeButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Helpers de presentación (no dependemos de nombres exactos)
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
  await requireUser(); // 🔐 asegura sesión (RLS)

  const q = (searchParams?.q ?? "").trim().toLowerCase();
  const filterDept = (searchParams?.department ?? "").trim();

  // Filtros
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name", { ascending: true });

  // Datos (dejamos RLS decidir qué filas ve el usuario)
  let empQuery = supabase.from("employees").select("*").order("created_at", {
    ascending: false,
  });
  if (filterDept) empQuery = empQuery.eq("department_id", filterDept);

  const { data: rawEmployees, error } = await empQuery;

  const employees = (rawEmployees ?? []).filter((e) =>
    q ? displayName(e).toLowerCase().includes(q) : true
  );

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
      {/* Header con volver + CTA */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Empleados
          </h1>
        </div>

        <Link
          prefetch={false}
          href="/employees/new"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-clientum-blue hover:bg-clientum-blueDark text-white shadow-clientum"
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
        </Link>
      </div>

      {/* Tarjeta de filtros */}
      <Card className="shadow-clientum border border-slate-200/70 mb-5">
        <CardContent className="p-4 md:p-5">
          <form className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center">
            <Input
              name="q"
              placeholder="Buscar por nombre…"
              defaultValue={searchParams?.q ?? ""}
              className="h-10"
            />
            <select
              name="department"
              defaultValue={filterDept}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">Todos los departamentos</option>
              {(departments ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <button
              className="h-10 rounded-md px-4 text-sm font-medium bg-clientum-blue hover:bg-clientum-blueDark text-white shadow-clientum"
            >
              Filtrar
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Tabla con zebra + hover y acciones */}
      <Card className="shadow-clientum border border-slate-200/70">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="w-[32%]">Nombre</TableHead>
                <TableHead className="w-[18%]">Puesto</TableHead>
                <TableHead className="w-[22%]">Departamento</TableHead>
                <TableHead className="w-[18%]">Alta</TableHead>
                <TableHead className="w-[10%] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-red-600">
                    {error.message}
                  </TableCell>
                </TableRow>
              ) : !employees || employees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-10 text-slate-500"
                  >
                    No hay empleados.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((e: any, idx: number) => (
                  <TableRow
                    key={e.id}
                    className={`
                      ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}
                      hover:bg-slate-100/60 transition-colors
                    `}
                  >
                    <TableCell className="align-middle">
                      <div className="font-medium text-slate-900">
                        {displayName(e)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {e.email ?? ""}
                      </div>
                    </TableCell>

                    <TableCell className="align-middle">
                      {displayPosition(e)}
                    </TableCell>

                    <TableCell className="align-middle">
                      <DepartmentSelect
                        employeeId={e.id}
                        currentId={e.department_id}
                        departments={(departments ?? []).map((d) => ({
                          id: d.id,
                          name: d.name,
                        }))}
                      />
                    </TableCell>

                    <TableCell className="align-middle">
                      {e.created_at
                        ? new Date(e.created_at as any).toLocaleString()
                        : "—"}
                    </TableCell>

                    <TableCell className="align-middle">
                      <div className="flex justify-end gap-2">
                        <Link
                          prefetch={false}
                          href={`/employees/${e.id}/edit`}
                          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                        >
                          Editar
                        </Link>
                        <DeleteEmployeeButton id={e.id} />
                      </div>
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
