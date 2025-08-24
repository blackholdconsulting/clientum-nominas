export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Emp = {
  id: string;
  full_name: string | null;
  position: string | null;
  start_date: string | null;
  salary_monthly: number | null;
};

export default async function EmployeesPage() {
  const { supabase, user } = await requireUser();

  let data: Emp[] = [];
  let errorMsg: string | null = null;

  try {
    const { data: d, error } = await supabase
      .from("nominas_employees")
      .select("id, full_name, position, start_date, salary_monthly")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    data = d || [];
  } catch (e: any) {
    errorMsg = e?.message || "No se pudieron cargar los empleados.";
    data = [];
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Empleados</h1>
        <Button asChild>
          <Link href="/employees/new">Añadir empleado</Link>
        </Button>
      </div>

      {errorMsg && (
        <p className="text-sm text-red-600 mb-4">{errorMsg}</p>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Listado</CardTitle>
          <Badge variant="secondary">{data.length}</Badge>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No hay empleados. Crea el primero.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Nombre</th>
                    <th className="py-2 pr-4">Puesto</th>
                    <th className="py-2 pr-4">Alta</th>
                    <th className="py-2 pr-4">Salario (€/mes)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((e) => (
                    <tr key={e.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 pr-4">{e.full_name ?? "—"}</td>
                      <td className="py-2 pr-4">{e.position ?? "—"}</td>
                      <td className="py-2 pr-4">
                        {e.start_date
                          ? new Date(e.start_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-2 pr-4">
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
        </CardContent>
      </Card>
    </div>
  );
}
