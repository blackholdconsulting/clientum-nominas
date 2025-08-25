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
  await requireUser(); // deja que la RLS gobierne

  // ⬇️ leemos por id (sin filtrar por user_id para soportar "claim or null")
  const [{ data: emp }, { data: departments }] = await Promise.all([
    supabase.from("employees").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("departments").select("id, name").order("name", { ascending: true }),
  ]);

  if (!emp) {
    return (
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <BackButton />
        <p className="mt-6 text-slate-600">Empleado no encontrado.</p>
      </main>
    );
  }

  // Helpers para inputs date/number
  const d = (v?: string | null) => (v ? v : "");
  const n = (v?: number | null) => (v ?? "") as any;

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <BackButton />
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
          Editar empleado
        </h1>
        <div />
      </div>

      <form action={updateEmployee} className="space-y-6">
        <input type="hidden" name="id" value={emp.id} />

        {/* === Información personal === */}
        <Card className="shadow-clientum">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-slate-700 font-semibold">
                Información Personal
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Nombre
                </label>
                <Input
                  name="first_name"
                  defaultValue={emp.first_name ?? ""}
                  placeholder="Juan"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Apellidos
                </label>
                <Input
                  name="last_name"
                  defaultValue={emp.last_name ?? ""}
                  placeholder="García López"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1">
                  Correo Electrónico
                </label>
                <Input
                  type="email"
                  name="email"
                  defaultValue={emp.email ?? ""}
                  placeholder="juan@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  DNI/NIE
                </label>
                <Input
                  name="national_id"
                  defaultValue={emp.national_id ?? ""}
                  placeholder="12345678A"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Teléfono
                </label>
                <Input
                  name="phone"
                  defaultValue={emp.phone ?? ""}
                  placeholder="+34 666 123 456"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1">
                  Dirección
                </label>
                <Input
                  name="address_line"
                  defaultValue={emp.address_line ?? ""}
                  placeholder="Calle Mayor, 123"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Ciudad
                </label>
                <Input name="city" defaultValue={emp.city ?? ""} placeholder="Madrid" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Código Postal
                </label>
                <Input
                  name="postal_code"
                  defaultValue={emp.postal_code ?? ""}
                  placeholder="28001"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Fecha de Nacimiento
                </label>
                <Input type="date" name="birth_date" defaultValue={d(emp.birth_date)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* === Información laboral === */}
        <Card className="shadow-clientum">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-slate-700 font-semibold">
                Información Laboral
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Puesto de Trabajo
                </label>
                <Input
                  name="job_title"
                  defaultValue={emp.job_title ?? emp.position ?? ""}
                  placeholder="Desarrollador Senior"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Departamento
                </label>
                <select
                  name="department_id"
                  className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                  defaultValue={emp.department_id ?? ""}
                >
                  <option value="">— Sin departamento —</option>
                  {(departments ?? []).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Tipo de Contrato
                </label>
                <select
                  name="contract_type"
                  className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                  defaultValue={emp.contract_type ?? ""}
                >
                  <option value="">Selecciona tipo</option>
                  <option>Indefinido</option>
                  <option>Temporal</option>
                  <option>Formación</option>
                  <option>Prácticas</option>
                  <option>Fijo-discontinuo</option>
                  <option>Relevo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Fecha de Inicio
                </label>
                <Input type="date" name="start_date" defaultValue={d(emp.start_date)} />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Horas Semanales
                </label>
                <Input name="weekly_hours" defaultValue={n(emp.weekly_hours)} placeholder="40" />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Salario Anual (€)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">€</span>
                  <Input
                    className="pl-7"
                    name="annual_salary_eur"
                    defaultValue={n(emp.annual_salary_eur)}
                    placeholder="35000"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* === Información adicional === */}
        <Card className="shadow-clientum">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-slate-700 font-semibold">
                Información Adicional
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Cuenta Bancaria (IBAN)
                </label>
                <Input name="iban" defaultValue={emp.iban ?? ""} placeholder="ES91…" />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Nº Seguridad Social
                </label>
                <Input name="ssn" defaultValue={emp.ssn ?? ""} placeholder="12 1234567890" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1">
                  Notas Adicionales
                </label>
                <textarea
                  name="notes"
                  rows={4}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  defaultValue={emp.notes ?? ""}
                  placeholder="Información adicional sobre el empleado…"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2">
          <a
            href="/employees"
            className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            Cancelar
          </a>
          <Button
            type="submit"
            className="bg-clientum-blue hover:bg-clientum-blueDark text-white"
          >
            Guardar
          </Button>
        </div>
      </form>
    </main>
  );
}
