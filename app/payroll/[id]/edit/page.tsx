// app/payroll/[id]/edit/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';          // ← CAMBIO
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

type ID = string | number;

interface Payroll {
  id: ID;
  period_year: number;
  period_month: number;
  status: 'draft' | 'closed' | string;
}

interface Employee {
  id: ID;
  full_name?: string;
  name?: string;
  nombre?: string;
}

interface Item {
  id?: ID;
  payroll_id: ID;
  employee_id: ID;
  base_gross: number;
  irpf_amount: number;
  ss_emp_amount: number;
  ss_er_amount: number;
  net: number;
  pdf_url?: string | null;
}

function empName(e: Employee | undefined) {
  if (!e) return '—';
  return e.full_name || e.name || e.nombre || '—';
}

export default function PayrollEditorPage({ params }: { params: { id: string } }) {
  // Cliente Supabase para navegador (sin helpers)
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createBrowserClient(url, anon);
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setFlash(null);

      // Cabecera
      const { data: pr } = await supabase
        .from('payrolls')
        .select('id, period_year, period_month, status')
        .eq('id', params.id)
        .maybeSingle();
      setPayroll(pr as Payroll | null);

      // Empleados
      const { data: emps } = await supabase
        .from('employees')
        .select('id, full_name, name, nombre')
        .order('full_name', { ascending: true });
      const list = (emps || []) as Employee[];
      setEmployees(list);

      // Items existentes
      const { data: its } = await supabase
        .from('payroll_items')
        .select('id, payroll_id, employee_id, base_gross, irpf_amount, ss_emp_amount, ss_er_amount, net, pdf_url')
        .eq('payroll_id', params.id);

      const map = new Map<ID, Item>();
      (its || []).forEach((it: any) => map.set(it.employee_id, it as Item));

      const merged: Item[] = list.map(e => {
        const found = map.get(e.id);
        return (
          found || {
            payroll_id: params.id,
            employee_id: e.id,
            base_gross: 0,
            irpf_amount: 0,
            ss_emp_amount: 0,
            ss_er_amount: 0,
            net: 0,
            pdf_url: null,
          }
        );
      });

      // Orden por nombre
      merged.sort((a, b) => empName(list.find(e => e.id === a.employee_id)!)
        .localeCompare(empName(list.find(e => e.id === b.employee_id)!)));

      setItems(merged);
      setLoading(false);
    })();
  }, [params.id, supabase]);

  const recalcRow = (row: Item): Item => {
    const net = Number(row.base_gross) - Number(row.irpf_amount) - Number(row.ss_emp_amount);
    return { ...row, net: +net.toFixed(2) };
  };

  const onChange = (idx: number, field: keyof Item, value: number) => {
    setItems(old => {
      const copy = [...old];
      // @ts-ignore
      copy[idx] = recalcRow({ ...copy[idx], [field]: isFinite(+value) ? +value : 0 });
      return copy;
    });
  };

  const totals = useMemo(() => {
    const t = items.reduce(
      (s, r) => {
        s.gross += r.base_gross || 0;
        s.irpf += r.irpf_amount || 0;
        s.sse += r.ss_emp_amount || 0;
        s.sser += r.ss_er_amount || 0;
        s.net += r.net || 0;
        return s;
      },
      { gross: 0, irpf: 0, sse: 0, sser: 0, net: 0 }
    );
    (Object.keys(t) as (keyof typeof t)[]).forEach(k => (t[k] = +t[k].toFixed(2)));
    return t;
  }, [items]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setFlash(null);

      const payload = items.map(i => ({
        id: i.id,
        payroll_id: i.payroll_id,
        employee_id: i.employee_id,
        base_gross: +i.base_gross || 0,
        irpf_amount: +i.irpf_amount || 0,
        ss_emp_amount: +i.ss_emp_amount || 0,
        ss_er_amount: +i.ss_er_amount || 0,
        net: +i.net || 0,
        pdf_url: i.pdf_url ?? null,
      }));

      const { data, error } = await supabase.from('payroll_items').upsert(payload).select();
      if (error) throw error;

      const withIds = (data as any[]) || [];
      const byEmp = new Map<ID, Item>();
      withIds.forEach((it: any) => byEmp.set(it.employee_id, it as Item));
      setItems(old => old.map(r => byEmp.get(r.employee_id) || r));

      setFlash('Cambios guardados ✅');
    } catch (e: any) {
      setFlash('Error al guardar: ' + (e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setGenerating(true);
      setFlash(null);

      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const title = `Nómina ${payroll?.period_month}/${payroll?.period_year}`;

      items.forEach((it) => {
        const emp = employees.find(e => e.id === it.employee_id);
        const page = pdf.addPage([595.28, 841.89]); // A4
        const { width } = page.getSize();
        const draw = (text: string, y: number, size = 12) => {
          page.drawText(text, { x: 40, y, size, font, color: rgb(0, 0, 0) });
        };
        page.drawText(title, { x: 40, y: 800, size: 18, font, color: rgb(0, 0, 0) });
        page.drawLine({ start: { x: 40, y: 792 }, end: { x: width - 40, y: 792 }, color: rgb(0, 0, 0), thickness: 0.5 });
        draw(`Empleado: ${empName(emp)}`, 760);
        draw(`Bruto base:   ${(+it.base_gross || 0).toFixed(2)} €`, 730);
        draw(`IRPF:         ${(+it.irpf_amount || 0).toFixed(2)} €`, 710);
        draw(`Seg. Social (emp.): ${(+it.ss_emp_amount || 0).toFixed(2)} €`, 690);
        draw(`Seg. Social (empresario): ${(+it.ss_er_amount || 0).toFixed(2)} €`, 670);
        draw(`Neto:         ${(+it.net || 0).toFixed(2)} €`, 640, 14);
        draw(`Periodo: ${String(payroll?.period_month).padStart(2, '0')}/${payroll?.period_year}`, 600, 10);
        draw(`Nómina ID: ${payroll?.id}`, 582, 10);
      });

      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `nomina-${payroll?.period_year}-${String(payroll?.period_month).padStart(2, '0')}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
      setFlash('PDF generado correctamente 📄');
    } catch (e: any) {
      setFlash('Error al generar PDF: ' + (e?.message || e));
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="p-6">Cargando editor…</div>;
  if (!payroll) return <div className="p-6">Nómina no encontrada.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/payroll" className="text-blue-600">← Volver</Link>
          <h1 className="text-2xl font-semibold mt-2">
            Editor de nómina {String(payroll.period_month).padStart(2, '0')}/{payroll.period_year}
            <span className="ml-3 text-sm font-normal px-2 py-1 rounded bg-slate-100 border">
              Estado: {payroll.status}
            </span>
          </h1>
        </div>
        <div className="text-right">
          <div className="text-sm">Bruto: <b>{totals.gross.toFixed(2)} €</b></div>
          <div className="text-sm">IRPF: <b>{totals.irpf.toFixed(2)} €</b></div>
          <div className="text-sm">SS emp.: <b>{totals.sse.toFixed(2)} €</b></div>
          <div className="text-sm">SS er.: <b>{totals.sser.toFixed(2)} €</b></div>
          <div className="text-base">Neto: <b>{totals.net.toFixed(2)} €</b></div>
        </div>
      </div>

      {flash && <div className="rounded border bg-slate-50 px-4 py-2 text-sm">{flash}</div>}

      <div className="overflow-x-auto bg-white rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-3 py-2">Empleado</th>
              <th className="text-right px-3 py-2">Bruto</th>
              <th className="text-right px-3 py-2">IRPF</th>
              <th className="text-right px-3 py-2">SS (emp.)</th>
              <th className="text-right px-3 py-2">SS (er.)</th>
              <th className="text-right px-3 py-2">Neto</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r, idx) => {
              const e = employees.find(x => x.id === r.employee_id);
              return (
                <tr key={`${r.employee_id}`} className="border-t">
                  <td className="px-3 py-2">{empName(e)}</td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      className="w-28 border rounded px-2 py-1 text-right"
                      value={r.base_gross}
                      onChange={(ev) => onChange(idx, 'base_gross', +ev.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      className="w-24 border rounded px-2 py-1 text-right"
                      value={r.irpf_amount}
                      onChange={(ev) => onChange(idx, 'irpf_amount', +ev.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      className="w-24 border rounded px-2 py-1 text-right"
                      value={r.ss_emp_amount}
                      onChange={(ev) => onChange(idx, 'ss_emp_amount', +ev.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      className="w-24 border rounded px-2 py-1 text-right"
                      value={r.ss_er_amount}
                      onChange={(ev) => onChange(idx, 'ss_er_amount', +ev.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">{(+r.net || 0).toFixed(2)} €</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>

        <button
          onClick={handleDownloadPDF}
          disabled={generating}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          {generating ? 'Generando…' : 'Descargar PDF'}
        </button>
      </div>
    </div>
  );
}
