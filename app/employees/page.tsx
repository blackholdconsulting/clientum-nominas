import BackButton from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import DepartmentSelect from "@/components/employees/DepartmentSelect";

export const dynamic = "force-dynamic";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: { q?: string; department?: string };
}) {
  const supabase = getSupabaseServerClient();
  const q = (searchParams?.q ?? "").trim();
  const filterDept = (searchParams?.department ?? "").trim();

  // Cargamos departamentos una vez
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name", { ascending: true });

  // Empleados con filtro opcional por nombre y por departamento
  let query = supabase
    .from("employees")
    .select("id, full_name, email, phone, position, department_id, created_at")
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("full_name", `%${q}%`);
  if (filterDept) query = query.eq("department_id", filterDept);

  const { data: employees } = await query;

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <BackButton />
        <h1 className="text-xl font-semibold text-slate-900">Empleados</h1>
        <div />
      </div>

      <Card className="shadow-clientum mb-4">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <form className="flex items-center gap-2 w-full md:w-auto">
            <Input name="q" placeholder="Buscar por nombre…" defaultValue={q} className="w-full md:w-64" />
            <select name="department" defaultValue={filterDept} className="border rounded-md px-2 py-1">
              <option value="">Todos los departamentos</option>
              {(departments ?? []).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button className="rounded-md px-3 py-2 bg-clientum-blue hover:bg-clientum-blueDark text-white">Filtrar</button>
          </form>
        </CardContent>
      </Card>

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
              {!employees || employees.length === 0 ? (
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
                      <div className="text-xs text-slate-500">{e.email ?? ""}</div>
                    </TableCell>
                    <TableCell>{e.position ?? "-"}</TableCell>
                    <TableCell>
                      <DepartmentSelect
                        employeeId={e.id}
                        currentId={e.department_id}
                        departments={(departments ?? []).map(d => ({ id: d.id, name: d.name }))}
                      />
                    </TableCell>
                    <TableCell>{new Date(e.created_at).toLocaleString()}</TableCell>
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
