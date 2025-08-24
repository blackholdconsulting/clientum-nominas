// app/contracts/page.tsx
export const dynamic = "force-dynamic";

import { hardRequireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Calculator,
  Plus,
  Search,
  Filter,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

/* ---------- Tipado UI ---------- */
type UiContract = {
  id: string;
  employeeId: string | null;
  employeeName: string;
  contractType: string | null;
  position: string | null;
  department: string | null;
  startDate: string | null;
  endDate: string | null;
  salary: number | null;
  status: string | null;
  renewalDate: string | null;
  createdDate: string | null;
  lastModified: string | null;
};

/* ---------- SERVER: obtener datos para el usuario ---------- */
async function getContractsForUser(): Promise<{ rows: UiContract[]; note?: string }> {
  const { user, supabase } = await hardRequireUser("/contracts");

  try {
    const { data, error } = await supabase
      .from("contracts")
      .select(`
        id,
        user_id,
        employee_id,
        type,
        position,
        department,
        start_date,
        end_date,
        salary,
        status,
        renewal_date,
        created_at,
        updated_at,
        employees:employee_id ( first_name, last_name )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rows: UiContract[] = (data ?? []).map((r: any) => {
      const full =
        r?.employees?.first_name || r?.employees?.last_name
          ? `${r?.employees?.first_name ?? ""} ${r?.employees?.last_name ?? ""}`.trim()
          : "—";

      return {
        id: r.id,
        employeeId: r.employee_id ?? null,
        employeeName: full,
        contractType: r.type ?? null,
        position: r.position ?? null,
        department: r.department ?? null,
        startDate: r.start_date ?? null,
        endDate: r.end_date ?? null,
        salary: typeof r.salary === "number" ? r.salary : r.salary ? Number(r.salary) : null,
        status: r.status ?? null,
        renewalDate: r.renewal_date ?? null,
        createdDate: r.created_at ?? null,
        lastModified: r.updated_at ?? r.created_at ?? null,
      };
    });

    return { rows };
  } catch (e: any) {
    // Si la tabla no existe o falla el JOIN, devolvemos lista vacía y nota
    return {
      rows: [],
      note:
        e?.message?.includes("relation") || e?.message?.includes("does not exist")
          ? "La tabla 'contracts' aún no existe o el JOIN a 'employees' no coincide con tu esquema. El UI seguirá cargando sin datos."
          : e?.message || String(e),
    };
  }
}

/* ---------- CLIENT: UI con filtros (sin fetch) ---------- */
function ContractsClient({ initialContracts, note }: { initialContracts: UiContract[]; note?: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [contracts] = useState<UiContract[]>(initialContracts);

  const filteredContracts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return contracts.filter((contract) => {
      const matchesSearch =
        !term ||
        (contract.employeeName ?? "").toLowerCase().includes(term) ||
        (contract.position ?? "").toLowerCase().includes(term) ||
        (contract.department ?? "").toLowerCase().includes(term);

      const matchesType = typeFilter === "all" || contract.contractType === typeFilter;
      const matchesStatus = statusFilter === "all" || contract.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [contracts, searchTerm, typeFilter, statusFilter]);

  const contractTypes = useMemo(
    () => Array.from(new Set(contracts.map((c) => c.contractType).filter(Boolean))) as string[],
    [contracts]
  );

  const activeContracts = useMemo(
    () => contracts.filter((c) => c.status === "Activo").length,
    [contracts]
  );
  const expiringContracts = useMemo(
    () => contracts.filter((c) => c.status === "Próximo a Vencer").length,
    [contracts]
  );

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "Activo":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Próximo a Vencer":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "Finalizado":
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case "Activo":
        return "default";
      case "Próximo a Vencer":
        return "destructive";
      case "Finalizado":
        return "secondary";
      default:
        return "outline";
    }
  };

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
            <Button asChild>
              <Link href="/contracts/new">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Contrato
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Nota de diagnóstico si no hay tabla / join falla */}
        {note && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center gap-2">
              <Info className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{note}</p>
            </CardContent>
          </Card>
        )}

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
                <Badge variant="secondary">{activeContracts}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{activeContracts}</CardTitle>
              <CardDescription>Contratos Activos</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <Badge variant="destructive">{expiringContracts}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{expiringContracts}</CardTitle>
              <CardDescription>Próximos a Vencer</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Filter className="h-8 w-8 text-primary" />
                <Badge variant="secondary">
                  {Array.from(new Set(contracts.map((c) => c.contractType).filter(Boolean))).length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">
                {Array.from(new Set(contracts.map((c) => c.contractType).filter(Boolean))).length}
              </CardTitle>
              <CardDescription>Tipos de Contrato</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por empleado, puesto o departamento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Tipo de contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {Array.from(new Set(contracts.map((c) => c.contractType).filter(Boolean))).map((t) => (
                    <SelectItem key={String(t)} value={String(t)}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Próximo a Vencer">Próximo a Vencer</SelectItem>
                  <SelectItem value="Finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Contratos ({filteredContracts.length})</CardTitle>
            <CardDescription>Información detallada de todos los contratos</CardDescription>
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
                  {filteredContracts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={`/abstract-geometric-shapes.png?height=40&width=40&query=${c.employeeName}`} />
                            <AvatarFallback>
                              {c.employeeName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{c.employeeName}</p>
                            <p className="text-sm text-muted-foreground">{c.position ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{c.department ?? "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.contractType ?? "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span>Inicio: {c.startDate ? new Date(c.startDate).toLocaleDateString("es-ES") : "—"}</span>
                          </div>
                          {c.endDate && (
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>Fin: {new Date(c.endDate).toLocaleDateString("es-ES")}</span>
                            </div>
                          )}
                          {c.renewalDate && (
                            <div className="flex items-center text-yellow-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              <span>Renovar: {new Date(c.renewalDate).toLocaleDateString("es-ES")}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {typeof c.salary === "number" ? `${c.salary.toLocaleString()}€` : "—"}
                        </span>
                        <p className="text-sm text-muted-foreground">anual</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(c.status)}
                          <Badge variant={(getStatusVariant(c.status) as any) ?? "outline"}>{c.status ?? "—"}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/contracts/${c.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/contracts/${c.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

/* ---------- PAGE SSR ---------- */
export default async function ContractsPage() {
  const { rows, note } = await getContractsForUser();
  return <ContractsClient initialContracts={rows} note={note} />;
}
