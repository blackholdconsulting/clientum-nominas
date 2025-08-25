import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { upsertPayroll } from "../../actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function PayrollEditPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient();
  await requireUser();

  const { data: p } = await supabase
    .from("payrolls")
    .select("*, employees:employee_id(full_name, email, national_id)")
    .eq("id", params.id)
    .maybeSingle();

  const { data: lines } = await supabase
    .from("payroll_lines")
    .select("*")
    .eq("payroll_id", params.id)
    .order("order_ix", { ascending: true });

  if (!p) {
    return <main className="max-w-4xl mx-auto p-6">Nómina no encontrada.</main>;
  }

  // componente cliente para edición
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Editar nómina · {p.employees?.full_name}</h1>
        <a className="rounded-md border px-3 py-2 text-sm" href="/payrolls">Volver</a>
      </div>

      <EditorClient payroll={p} lines={lines ?? []} />
    </main>
  );
}

function num(n?: number) { return typeof n === "number" ? n.toFixed(2) : "0.00"; }

// Componente cliente embebido
function EditorClient({ payroll, lines }: { payroll: any; lines: any[] }) {
  "use client";
  const [rows, setRows] = React.useState(
    lines.length ? lines : [
      { concept_code:"SB", concept_name:"Salario Base", units:1, amount:1200, typ:"earning", base_cc:true, base_irpf:true },
      { concept_code:"PR", concept_name:"Prorrata Pagas", units:1, amount:200, typ:"earning", base_cc:true, base_irpf:true },
      { concept_code:"ANT", concept_name:"Anticipo", units:1, amount:-100, typ:"deduction", base_cc:false, base_irpf:false },
    ]
  );
  const [irpfPct, setIrpfPct] = React.useState<number>(payroll.irpf_pct ?? 2);
  const [saving, setSaving] = React.useState(false);

  const gross = rows.filter(r=>r.typ==="earning").reduce((a,b)=>a+b.amount,0);
  const ded = rows.filter(r=>r.typ==="deduction").reduce((a,b)=>a+Math.abs(b.amount),0);
  const baseCC = rows.filter(r=>r.base_cc && r.amount>0).reduce((a,b)=>a+b.amount,0);
  const baseIRPF = rows.filter(r=>r.base_irpf && r.amount>0).reduce((a,b)=>a+b.amount,0);
  const ssEmp = +(baseCC*0.0635).toFixed(2);
  const irpf = +(baseIRPF*irpfPct/100).toFixed(2);
  const net = +(gross - ded - ssEmp - irpf).toFixed(2);

  function addRow() {
    setRows([...rows, { concept_code:"", concept_name:"", units:1, amount:0, typ:"earning", base_cc:true, base_irpf:true }]);
  }
  function removeRow(i: number) {
    setRows(rows.filter((_,ix)=>ix!==i));
  }
  function updateRow(i:number, k:string, v:any) {
    const clone = [...rows]; (clone as any)[i][k] = v; setRows(clone);
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        id: payroll.id as string,
        employee_id: payroll.employee_id as string,
        period_year: payroll.period_year as number,
        period_month: payroll.period_month as number,
        irpf_pct: irpfPct,
        lines: rows.map((r,ix)=>({
          concept_code: r.concept_code || `C${ix+1}`,
          concept_name: r.concept_name || "Concepto",
          units: Number(r.units)||1,
          amount: Number(r.amount)||0,
          typ: r.typ,
          base_cc: !!r.base_cc,
          base_irpf: !!r.base_irpf,
          order_ix: ix
        }))
      };
      await upsertPayroll(payload);
      alert("Nómina guardada");
    } catch(e:any) {
      alert(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="shadow-clientum">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm text-slate-600">IRPF %</label>
            <Input type="number" step="0.01" value={irpfPct} onChange={e=>setIrpfPct(+e.target.value)} className="w-24" />
          </div>
          <div className="ml-auto text-sm text-slate-700">
            <div>Devengos: <b>€{num(gross)}</b></div>
            <div>Deducciones: <b>€{num(ded)}</b></div>
            <div>Base CC: <b>€{num(baseCC)}</b> · Cuota Trab.: <b>€{num(ssEmp)}</b></div>
            <div>Base IRPF: <b>€{num(baseIRPF)}</b> · IRPF: <b>€{num(irpf)}</b></div>
            <div className="text-lg mt-1">Neto: <b>€{num(net)}</b></div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-2 py-2">Código</th>
                <th className="px-2 py-2">Concepto</th>
                <th className="px-2 py-2">Un.</th>
                <th className="px-2 py-2">Importe</th>
                <th className="px-2 py-2">Tipo</th>
                <th className="px-2 py-2">CC</th>
                <th className="px-2 py-2">IRPF</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i)=>(
                <tr key={i} className="border-t">
                  <td className="px-2 py-2"><Input value={r.concept_code} onChange={e=>updateRow(i,"concept_code", e.target.value)} /></td>
                  <td className="px-2 py-2"><Input value={r.concept_name} onChange={e=>updateRow(i,"concept_name", e.target.value)} /></td>
                  <td className="px-2 py-2"><Input type="number" value={r.units} onChange={e=>updateRow(i,"units", +e.target.value)} className="w-20"/></td>
                  <td className="px-2 py-2"><Input type="number" step="0.01" value={r.amount} onChange={e=>updateRow(i,"amount", +e.target.value)} className="w-32"/></td>
                  <td className="px-2 py-2">
                    <select className="border rounded px-2 py-1" value={r.typ} onChange={e=>updateRow(i,"typ", e.target.value)}>
                      <option value="earning">Devengo</option>
                      <option value="deduction">Deducción</option>
                    </select>
                  </td>
                  <td className="px-2 py-2 text-center"><input type="checkbox" checked={!!r.base_cc} onChange={e=>updateRow(i,"base_cc", e.target.checked)} /></td>
                  <td className="px-2 py-2 text-center"><input type="checkbox" checked={!!r.base_irpf} onChange={e=>updateRow(i,"base_irpf", e.target.checked)} /></td>
                  <td className="px-2 py-2 text-right">
                    <button type="button" onClick={()=>removeRow(i)} className="rounded border px-2 py-1">Quitar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between">
          <Button type="button" onClick={addRow} className="bg-white border text-slate-700 hover:bg-slate-50">
            + Añadir concepto
          </Button>
          <div className="flex gap-2">
            <a className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-slate-50"
               href={`/api/payrolls/${payroll.id}/pdf`} target="_blank">
              Exportar PDF
            </a>
            <Button type="button" onClick={save} disabled={saving}
              className="bg-clientum-blue hover:bg-clientum-blueDark text-white">
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import * as React from "react";
