// app/contracts/[id]/fill/page.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Contract } from "@/types/contracts";
import type { ModeloKey } from "@/lib/contracts/pdf";
import { buildPdfPayload } from "@/lib/contracts/pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MODELOS: ModeloKey[] = [
  "CIND-2504-CAS-C",
  "CTEM-2505-CAS-C",
  "CFEA-2504-CAS-C",
  "CFOPP-2504-CAS-C",
  "CPES-2504-CAS-C",
  "ANEXO-MOD-191-2411-CAS-C",
  "ANEXO-MOD-192-2411-CAS-C",
  "ANEXO_200_2411_CAS-C",
];

export default function FillModelPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [c, setC] = useState<Contract | null>(null);
  const [modelo, setModelo] = useState<ModeloKey>("CIND-2504-CAS-C");
  const [form, setForm] = useState<Record<string, any>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("contracts").select("*").eq("id", id).single();
      if (data) {
        setC(data as Contract);
        // precarga campos básicos
        setForm({
          employee_name: data.employee_name,
          position: data.position ?? "",
          department: data.department ?? "",
          start_date: data.start_date,
          end_date: data.end_date ?? "",
          salary: data.salary ?? "",
        });
      }
    })();
  }, [id]);

  function setField(k: string, v: any) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function save() {
    if (!c) return;
    startTransition(async () => {
      const payload = await buildPdfPayload(modelo, form);
      await supabase.from("contracts").update({ payload }).eq("id", c.id);
      router.push(`/contracts/${c.id}`);
    });
  }

  if (!c) return <div className="p-6 text-muted-foreground">Cargando…</div>;

  return (
    <div className="container max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Rellenar modelo oficial</CardTitle>
          <CardDescription>
            Contrato de <strong>{c.employee_name}</strong> — selecciona el modelo y completa los campos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={modelo} onValueChange={(v) => setModelo(v as ModeloKey)}>
            <SelectTrigger><SelectValue placeholder="Modelo" /></SelectTrigger>
            <SelectContent>
              {MODELOS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Campos comunes; puedes añadir campos específicos por modelo */}
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              value={form.employee_name ?? ""}
              onChange={(e) => setField("employee_name", e.target.value)}
              placeholder="Nombre empleado"
            />
            <Input
              value={form.position ?? ""}
              onChange={(e) => setField("position", e.target.value)}
              placeholder="Puesto"
            />
            <Input
              value={form.department ?? ""}
              onChange={(e) => setField("department", e.target.value)}
              placeholder="Departamento"
            />
            <Input
              type="date"
              value={form.start_date ?? ""}
              onChange={(e) => setField("start_date", e.target.value)}
              placeholder="Fecha inicio"
            />
            <Input
              type="date"
              value={form.end_date ?? ""}
              onChange={(e) => setField("end_date", e.target.value)}
              placeholder="Fecha fin"
            />
            <Input
              type="number"
              value={form.salary ?? ""}
              onChange={(e) => setField("salary", e.target.value)}
              placeholder="Salario anual"
            />
          </div>

          <div className="flex justify-end">
            <Button disabled={isPending} onClick={save}>
              Guardar en contrato
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
