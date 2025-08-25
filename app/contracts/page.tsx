import Link from "next/link";
import BackButton from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { createContract } from "./actions";
import { Plus, FileText, CheckCircle2, AlertTriangle, Filter } from "lucide-react";

export const dynamic = "force-dynamic";

function fmt(date?: string | null) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString();
}

export default async function ContractsPage({
  searchParams,
}: { searchParams?: { q?: string; status?: string } }) {
  const supabase = getSupabaseServerClient();
  const user = await requireUser();

  // Empleados SOLO del usuario actual
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name")
    .eq("user_id", user.id)
    .order("full_name", { ascending: true });

  // Contadores SOLO del usuario actual
  const todayISO = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const [{ count: totalCount }, { count: activeCount }, { count: expiringCount }] =
    await Promise.all([
      supabase.from("contracts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("contracts").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
      supabase.from("contracts").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("end_date", todayISO).lte("end_date", in30),
    ]);

  // Filtros
  const q = (searchParams?.q ?? "").trim();
  const status = (searchParams?.status ?? "").trim();

  let listQuery = supabase
    .from("contracts")
    .select("id, contract_type, start_date, end_date, status, employee:employees(id, full_name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status) listQuery = listQuery.eq("status", status);
  // Para buscar por nombre, hacemos un join client-side si la búsqueda no es soportada server-side:
  const { data: rowsRaw } = await listQuery;
  const rows = (rowsRaw ?? []).filter((c) =>
    q ? (c as any).employee?.full_name?.toLowerCase().includes(q.toLowerCase()) : true
  );

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Clientum Nóminas <span className="ml-2 text-sm font-normal text-slate-500">Contratos</span>
          </h1>
        </div>
        <Link href="/plantillas" className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm text-slate-800 hover:bg-slate-50">
          <FileText className="size-4" /> Modelos
        </Link>
      </div>

      {/* Crear contrato */}
      <Card className="shadow-clientum mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Crear contrato</h2>
          <p className="text-sm text-slate-500 mb-4">Genera un contrato básico y complétalo después con el modelo oficial.</p>

          <form action={createContract} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Empleado</label>
              <select name="employee_id" className="w-full rounded-md border bg-white px-3 py-2 text-sm" defaultValue="" required>
                <option value="" disabled>Selecciona empleado</option>
                {(employees ?? []).map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Tipo</label>
              <select name="contract_type" className="w-full rounded-md border bg-white px-3 py-2 text-sm" defaultValue="Indefinido">
                <option>Indefinido</option>
                <option>Temporal</option>
                <option>Formación</option>
                <option>Prácticas</option>
                <option>Fijo-discontinuo</option>
                <option>Relevo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Fecha de inicio</label>
              <Input type="date" name="start_date" />
            </div>

            <div className="flex md:justify-end">
              <Button type="submit" className="bg-clientum-blue hover:bg-clientum-blueDark text-white inline-flex items-center gap-2">
                <Plus className="size-4" /> Crear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-clientum"><CardContent className="p-5">
          <div className="flex items-center gap-2 text-slate-700"><FileText className="size-5" /><span className="text-sm">Total Contratos</span></div>
          <div className="mt-3 text-2xl font-semibold">{totalCount ?? 0}</div>
        </CardContent></Card>
        <Card className="shadow-clientum"><CardContent className="p-5">
          <div className="flex items-center gap-2 text-slate-700"><CheckCircle2 className="size-5" /><span className="text-sm">Contratos Activos</span></div>
          <div className="mt-3 text-2xl font-semibold">{activeCount ?? 0}</div>
        </CardContent></Card>
        <Card className="shadow-clientum"><CardContent className="p-5">
          <div className="flex items-center gap-2 text-slate-700"><AlertTriangle className="size-5" /><span className="text-sm">Próximos a Vencer (30 días)</span></div>
          <div className="mt-3 text-2xl font-semibold">{expiringCount ?? 0}</div>
        </CardContent></Card>
      </div>

      {/* Filtros */}
      <Card className="shadow-clientum mb-4">
        <CardContent className="p-4">
          <form className="flex flex-col md:flex-row gap-3 items-center">
            <div className="flex-1 w-full"><Input name="q" placeholder="Buscar por empleado…" defaultValue={q} /></div>
            <select name="status" defaultValue={status} className="rounded-md border bg-white px-3 py-2 text-sm">
              <option value="">Todos</option>
              <option value="draft">Borrador</option>
              <option value="active">Activo</option>
              <option value="ended">Finalizado</option>
            </select>
            <Button type="submit" variant="outline" className="inline-flex items-center gap-2">
              <Filter className="size-4" /> Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Listado */}
      <Card className="shadow-clientum">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Empleado</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!rows || rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">Sin resultados</TableCell>
                </TableRow>
              ) : (
                rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{(c as any).employee?.full_name ?? "—"}</TableCell>
                    <TableCell>{(c as any).contract_type}</TableCell>
                    <TableCell>{fmt((c as any).start_date)} {(c as any).end_date ? `→ ${fmt((c as any).end_date)}` : ""}</TableCell>
                    <TableCell className="capitalize">{(c as any).status}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/contracts/${(c as any).id}`} className="rounded-md border bg-white px-3 py-1.5 text-sm hover:bg-slate-50">Abrir</Link>
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
