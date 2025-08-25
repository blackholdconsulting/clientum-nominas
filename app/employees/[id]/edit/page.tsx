import BackButton from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { updateEmployee } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditEmployeePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = getSupabaseServerClient();
  const user = await requireUser();

  const [{ data: emp }, { data: departments }] = await Promise.all([
    supabase
      .from("employees")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("departments").select("id, name").order("name", { ascending: true }),
  ]);

  if (!emp) {
    return (
      <main className="max-w-3xl mx-auto p-4 md:p-6">
        <BackButton />
        <p className="mt-6 text-slate-600">Empleado no encontrado.</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <BackButton />
        <h1 className="text-xl font-semibold text-slate-900">Editar empleado</h1>
        <div />
      </div>

      <Card className="shadow-clientum">
        <CardContent className="p-6">
          <form action={updateEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="hidden" name="id" value={emp.id} />

            <div className="md:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">Nombre completo</label>
              <Input name="full_name" defaultValue={emp.full_name ?? emp.name ?? ""} required />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Email</label>
              <Input type="email" name="email" defaultValue={emp.email ?? ""} />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Teléfono</label>
              <Input name="phone" defaultValue={emp.phone ?? ""} />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Puesto</label>
              <Input name="position" defaultValue={emp.position ?? emp.job_title ?? ""} />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Departamento</label>
              <select
                name="department_id"
                defaultValue={emp.department_id ?? ""}
                className="w-full rounded-md border bg-white px-3 py-2 text-sm"
              >
                <option value="">— Sin departamento —</option>
                {(departments ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
              <a href="/employees" className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-slate-50">
                Cancelar
              </a>
              <Button type="submit" className="bg-clientum-blue hover:bg-clientum-blueDark text-white">
                Guardar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
