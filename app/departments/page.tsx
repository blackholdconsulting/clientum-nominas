import BackButton from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createDepartment, deleteDepartment } from "./actions";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const supabase = getSupabaseServerClient();

  const { data: depts } = await supabase
    .from("departments")
    .select("id, name, slug, description, created_at")
    .order("created_at", { ascending: false });

  // Conteo de empleados por departamento (simple y eficaz)
  const counts: Record<string, number> = {};
  if (depts && depts.length) {
    for (const d of depts) {
      const { count } = await supabase
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("department_id", d.id);
      counts[d.id] = count ?? 0;
    }
  }

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <BackButton />
        <h1 className="text-xl font-semibold text-slate-900">Departamentos</h1>
        <div />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-clientum">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Crear nuevo departamento</h2>
            <form action={createDepartment} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input name="name" placeholder="Nombre (p. ej. RRHH, Ventas, IT)" />
              <Textarea name="description" placeholder="Descripción (opcional)" className="md:col-span-2" />
              <div className="md:col-span-3">
                <Button className="bg-clientum-blue hover:bg-clientum-blueDark text-white">Crear</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-clientum">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Empleados</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!depts || depts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                      Aún no hay departamentos.
                    </TableCell>
                  </TableRow>
                ) : (
                  depts.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell>{d.slug ?? "-"}</TableCell>
                      <TableCell>{counts[d.id] ?? 0}</TableCell>
                      <TableCell>{new Date(d.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <form action={deleteDepartment} className="inline">
                          <input type="hidden" name="id" value={d.id} />
                          <Button variant="destructive" className="inline-flex items-center gap-1">
                            <Trash2 className="size-4" />
                            Eliminar
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
