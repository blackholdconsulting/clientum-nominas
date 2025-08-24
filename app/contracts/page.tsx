// app/contracts/page.tsx
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Calculator, Plus, Search, Filter, FileText, Calendar,
  AlertTriangle, CheckCircle, Clock, Eye
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Contract, ContractStatus, ContractType } from "@/types/contracts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

type Employee = { id: string; full_name: string };

const CONTRACT_TYPES: ContractType[] = [
  "Indefinido",
  "Temporal",
  "Formación",
  "Prácticas",
  "Fijo-discontinuo",
];

function statusIcon(status: ContractStatus) {
  if (status === "Activo") return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (status === "Próximo a Vencer") return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  return <Clock className="h-4 w-4 text-gray-500" />;
}

function statusVariant(status: ContractStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "Activo") return "default";
  if (status === "Próximo a Vencer") return "destructive";
  return "secondary";
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // filtros
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ContractType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ContractStatus>("all");

  // formulario rápido crear contrato
  const [newEmployeeId, setNewEmployeeId] = useState<string>("");
  const [newType, setNewType] = useState<ContractType>("Indefinido");
  const [newStart, setNewStart] = useState<string>("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      // 1) traer empleado(s) del usuario (RLS ya filtra por auth.uid())
      const { data: emp, error: empErr } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .order("created_at", { ascending: true });

      if (!empErr) {
        const mapped = (emp || []).map((e) => ({
          id: e.id,
          full_name: `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() || "Empleado",
        }));
        setEmployees(mapped);
      }

      // 2) traer contratos del usuario
      const { data: ctr, error } = await supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setContracts((ctr as Contract[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      const hayBusqueda =
        c.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        (c.position ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (c.department ?? "").toLowerCase().includes(search.toLowerCase());

      const okTipo = typeFilter === "all" || c.contract_type === typeFilter;
      const okEstado = statusFilter === "all" || c.status === statusFilter;

      return hayBusqueda && okTipo && okEstado;
    });
  }, [contracts, search, typeFilter, statusFilter]);

  const active = contracts.filter((c) => c.status === "Activo").length;
  const expiring = contracts.filter((c) => c.status === "Próximo a Vencer").length;
  const tipos = Array.from(new Set(contracts.map((c) => c.contract_type)));

  async function createContract() {
    if (!newEmployeeId || !newStart) return;

    // obtener nombre del empleado para denormalizar (UX rápido)
    const emp = employees.find((e) => e.id === newEmployeeId);
    const employeeName = emp?.full_name ?? "Empleado";

    startTransition(async () => {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from("contracts")
        .insert({
          user_id: userId,
          employee_id: newEmployeeId,
          employee_name: employeeName,
          contract_type: newType,
          start_date: newStart,
          status: "Activo",
          payload: {},
        })
        .select()
        .single();

      if (!error && data) {
        setContracts((prev) => [data as Contract, ...prev]);
        setNewEmployeeId("");
        setNewStart("");
        setNewType("Indefinido");
      }
    });
  }

  if (loading) {
    return (
      <div className="p-8 text-muted-foreground">
        Cargando contratos…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Calculator className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold font-serif text-primary">Clientum Nóminas</h1>
              </Link>
              <Badge variant="secondary">Contratos</Badge>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/contracts/models">
                  <FileText className="h-4 w-4 mr-2" />
                  Modelos
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Nuevo contrato rápido */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Crear contrato</CardTitle>
            <CardDescription>Genera un contrato básico y complétalo después con el modelo oficial.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-4">
            <Select value={newEmployeeId} onValueChange={setNewEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Empleado" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={newType} onValueChange={(v: ContractType) => setNewType(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de contrato" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              placeholder="Inicio"
            />

            <Button disabled={isPending || !newEmployeeId || !newStart} onClick={createContract}>
              <Plus className="h-4 w-4 mr-2" />
              Crear
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <FileText className="h-8 w-8 text-primary" />
                <Badge variant="secondary">{contracts.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{contracts.length}</CardTitle>
              <CardDescription>Total Contratos</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <Badge variant="secondary">{active}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{active}</CardTitle>
              <CardDescription>Contratos Activos</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <Badge variant="destructive">{expiring}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{expiring}</CardTitle>
              <CardDescription>Próximos a Vencer</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Filter className="h-8 w-8 text-primary" />
                <Badge variant="secondary">{tipos.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{tipos.length}</CardTitle>
              <CardDescription>Tipos de Contrato</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros y búsqueda</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empleado, puesto o departamento…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <SelectTrigger className="md:w-56">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {CONTRACT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="md:w-56">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Próximo a Vencer">Próximo a Vencer</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de contratos ({filtered.length})</CardTitle>
            <CardDescription>Información detallada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead>Salario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={`/abstract-geometric-shapes.png?height=40&width=40&seed=${c.employee_name}`} />
                            <AvatarFallback>
                              {c.employee_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{c.employee_name}</p>
                            {c.position && <p className="text-sm text-muted-foreground">{c.position}</p>}
                            {c.department && <p className="text-xs text-muted-foreground">{c.department}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.contract_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                            Inicio: {new Date(c.start_date).toLocaleDateString("es-ES")}
                          </div>
                          {c.end_date && (
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              Fin: {new Date(c.end_date).toLocaleDateString("es-ES")}
                            </div>
                          )}
                          {c.renewal_date && (
                            <div className="flex items-center text-yellow-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Renovar: {new Date(c.renewal_date).toLocaleDateString("es-ES")}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.salary != null ? (
                          <>
                            <span className="font-medium">
                              {Number(c.salary).toLocaleString("es-ES")} €
                            </span>
                            <p className="text-sm text-muted-foreground">anual</p>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {statusIcon(c.status)}
                          <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/contracts/${c.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Link>
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/contracts/${c.id}/fill`}>
                              <FileText className="h-4 w-4 mr-1" />
                              Modelo
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Sin resultados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
