"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Payroll = {
  id: string;
  year: number;
  month: number;
  status?: string | null;
  org_id?: string | null;
  organization_id?: string | null;
  irpf_pct?: number | null;     // override periodo
  ss_emp_pct?: number | null;   // override periodo (trabajador)
  days_in_period?: number | null;
};

type Employee = {
  id: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  position?: string | null;
  job_title?: string | null;
  irpf_pct?: number | null;
  ss_emp_pct?: number | null; // trabajador
  ss_er_pct?: number | null;  // empresa
  iban?: string | null;
  national_id?: string | null;
  ssn?: string | null;
};

type Item = {
  id: string;
  payroll_id: string;
  employee_id: string;
  type: "earning" | "deduction" | string | null;
  concept?: string | null;
  description?: string | null;
  quantity?: number | null;
  amount?: number | null;
  cotizable?: boolean | null;
  sujeto_irpf?: boolean | null;
  category?: "salarial" | "no_salarial" | null;
  concept_code?: string | null;
  notes?: string | null;
};

type Props = {
  year: number;
  month: number;
  employeeId?: string | null;
  activeOrgId?: string;
};

function cx(...cn: Array<string | false | null | undefined>) {
  return cn.filter(Boolean).join(" ");
}
function num(n: any, def = 0): number {
  const v = typeof n === "string" ? n.replace(",", ".") : n;
  const p = Number(v);
  return Number.isFinite(p) ? p : def;
}

export default function EmployeePayrollEditor({ year, month, employeeId, activeOrgId }: Props) {
  const [period, setPeriod] = useState<Payroll | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pdfState, setPdfState] = useState<{ loading: boolean; url?: string | null; msg?: string | null }>({ loading: false });

  const supabase = useMemo(() => supabaseBrowser(), []);

  // CARGA
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErrorMsg(null);
      setPeriod(null);
      setEmployee(null);
      setItems([]);

      let q = supabase.from("payrolls").select("*").eq("year", year).eq("month", month).limit(1);
      if (activeOrgId) q = q.or(`org_id.eq.${activeOrgId},organization_id.eq.${activeOrgId}`);
      const { data: pData, error: pErr } = await q;
      if (pErr) { setErrorMsg(`Error periodo: ${pErr.message}`); setLoading(false); return; }
      const p = (pData ?? [])[0] as Payroll | undefined;
      if (!p) { setLoading(false); return; }
      setPeriod(p);

      if (employeeId) {
        let eQ = supabase.from("employees").select("*").eq("id", employeeId).limit(1);
        if (activeOrgId) eQ = eQ.or(`org_id.eq.${activeOrgId},organization_id.eq.${activeOrgId}`);
        const { data: eData, error: eErr } = await eQ;
        if (eErr) setErrorMsg(`Error empleado: ${eErr.message}`); else setEmployee((eData ?? [])[0] as Employee);

        const { data: itData, error: itErr } = await supabase
          .from("payroll_items").select("*")
          .eq("payroll_id", p.id).eq("employee_id", employeeId)
          .order("id", { ascending: true });
        if (itErr) setErrorMsg(`Error items: ${itErr.message}`); else setItems((itData ?? []) as Item[]);
      }

      setLoading(false);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, employeeId, activeOrgId]);

  // TOTALES
  const totals = useMemo(() => {
    const earnings = items.filter((i) => (i.type ?? "").toLowerCase() === "earning");
    const deductions = items.filter((i) => (i.type ?? "").toLowerCase() === "deduction");

    const totalDevengos = earnings.reduce((acc, it) => acc + num(it.amount), 0);
    const totalDeduccionesManuales = deductions.reduce((acc, it) => acc + num(it.amount), 0);

    const baseCotizacion = items.filter((i) => i.cotizable ?? true).reduce((acc, it) => acc + num(it.amount), 0);
    const baseIRPF = items.filter((i) => i.sujeto_irpf ?? true).reduce((acc, it) => acc + num(it.amount), 0);

    const pctIRPF = num(period?.irpf_pct ?? employee?.irpf_pct, 0);
    const pctSSTrab = num(period?.ss_emp_pct ?? employee?.ss_emp_pct, 0);
    const pctSSEmp = num(employee?.ss_er_pct, 29.9);

    const ssTrab = (baseCotizacion * pctSSTrab) / 100;
    const irpf = (baseIRPF * pctIRPF) / 100;
    const totalDeducciones = totalDeduccionesManuales + ssTrab + irpf;
    const neto = totalDevengos - totalDeducciones;

    const ssEmp = (baseCotizacion * pctSSEmp) / 100;

    return {
      totalDevengos, totalDeduccionesManuales, baseCotizacion, baseIRPF,
      ssTrab, irpf, totalDeducciones, neto, pctIRPF, pctSSTrab, pctSSEmp, ssEmp
    };
  }, [items, period?.irpf_pct, period?.ss_emp_pct, employee?.irpf_pct, employee?.ss_emp_pct, employee?.ss_er_pct]);

  // AVISOS
  const warnings = useMemo(() => {
    const w: string[] = [];
    for (const it of items) {
      if ((it.category ?? "salarial") === "no_salarial" && (it.cotizable ?? true)) {
        w.push(`"${it.concept ?? it.description ?? "Concepto"}" marcado como NO salarial pero cotizable. Revisa flags.`);
      }
      if ((it.type ?? "").toLowerCase() === "deduction" && (it.amount ?? 0) < 0) {
        w.push(`La deducción "${it.concept ?? "Concepto"}" tiene importe negativo. Usa importe positivo.`);
      }
    }
    return w;
  }, [items]);

  // MUTACIONES
  const addItem = async (kind: "earning" | "deduction") => {
    if (!period || !employeeId) return;
    const { data, error } = await supabase
      .from("payroll_items")
      .insert({
        payroll_id: period.id,
        employee_id: employeeId,
        type: kind,
        concept: kind === "earning" ? "Devengo" : "Deducción",
        amount: 0,
        cotizable: kind === "earning",
        sujeto_irpf: true,
        category: "salarial",
      })
      .select("*")
      .single();
    if (!error && data) setItems((prev) => [...prev, data as Item]);
    else setErrorMsg(error?.message ?? "Error al crear línea");
  };

  const updateItem = useCallback(
    async (id: string, patch: Partial<Item>) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
      const { error } = await supabase.from("payroll_items").update(patch).eq("id", id);
      if (error) setErrorMsg(error.message);
    },
    [supabase]
  );

  const deleteItem = async (id: string) => {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));
    const { error } = await supabase.from("payroll_items").delete().eq("id", id);
    if (error) { setErrorMsg(error.message); setItems(prev); }
  };

  const savePeriodPercents = async () => {
    if (!period) return;
    setSaving(true);
    const { error } = await supabase.from("payrolls")
      .update({ irpf_pct: totals.pctIRPF, ss_emp_pct: totals.pctSSTrab })
      .eq("id", period.id);
    if (error) setErrorMsg(error.message);
    setSaving(false);
  };

  // PDF
  const generatePDF = async () => {
    if (!period || !employeeId) return;
    setPdfState({ loading: true });
    const res = await fetch("/api/payroll/receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payrollId: period.id, employeeId }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) setPdfState({ loading: false, msg: json.error ?? "Error generando PDF" });
    else setPdfState({ loading: false, url: json.url ?? null, msg: "PDF generado correctamente." });
  };

  // RENDER
  if (loading) return <div className="flex h-full items-center justify-center text-sm text-gray-500">Cargando editor…</div>;
  if (!period) return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <p className="text-sm text-gray-600">No existe periodo <span className="font-semibold">{month}/{year}</span>.</p>
      <p className="text-xs text-gray-500">Genera el periodo antes de editar nóminas.</p>
    </div>
  );
  if (!employeeId) return <div className="flex h-full items-center justify-center"><p className="text-sm text-gray-600">Selecciona un empleado en la columna izquierda.</p></div>;

  const employeeName =
    (employee?.full_name ?? [employee?.first_name, employee?.last_name].filter(Boolean).join(" ")) ||
    "Empleado";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            {employeeName} · {String(month).padStart(2, "0")}/{year}
          </h3>
          <p className="text-xs text-gray-500">Periodo #{period.id} · Estado: {period.status ?? "—"}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500">Neto a percibir</p>
            <p className="text-lg font-semibold">
              {totals.neto.toLocaleString(undefined, { style: "currency", currency: "EUR" })}
            </p>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="grid flex-1 grid-cols-12 gap-0">
        {/* LÍNEAS */}
        <section className="col-span-7 h-full overflow-auto">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-sm font-medium text-gray-700">Líneas</div>
            <div className="flex items-center gap-2">
              <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50" onClick={() => addItem("earning")}>
                + Añadir devengo
              </button>
              <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50" onClick={() => addItem("deduction")}>
                + Añadir deducción
              </button>
            </div>
          </div>

          <ul className="divide-y">
            {items.map((it) => {
              const isDed = (it.type ?? "").toLowerCase() === "deduction";
              return (
                <li key={it.id} className="grid grid-cols-12 items-center gap-3 px-4 py-3">
                  <div className="col-span-2">
                    <select
                      value={it.type ?? "earning"}
                      onChange={(e) => updateItem(it.id, { type: e.target.value as any })}
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                    >
                      <option value="earning">Devengo</option>
                      <option value="deduction">Deducción</option>
                    </select>
                    <input
                      value={it.concept_code ?? ""}
                      placeholder="Código"
                      onChange={(e) => updateItem(it.id, { concept_code: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                    />
                  </div>

                  <div className="col-span-4">
                    <input
                      value={it.concept ?? it.description ?? ""}
                      placeholder="Concepto / descripción"
                      onChange={(e) => updateItem(it.id, { concept: e.target.value, description: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                    />
                    <select
                      value={it.category ?? "salarial"}
                      onChange={(e) => updateItem(it.id, { category: e.target.value as any })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                    >
                      <option value="salarial">Salarial</option>
                      <option value="no_salarial">No salarial</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500">Cantidad</label>
                    <input
                      type="number" step="0.01"
                      value={it.quantity ?? 1}
                      onChange={(e) => updateItem(it.id, { quantity: num(e.target.value, 1) })}
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-xs text-gray-500">Importe</label>
                    <input
                      type="number" step="0.01"
                      value={it.amount ?? 0}
                      onChange={(e) => updateItem(it.id, { amount: num(e.target.value, 0) })}
                      className={cx("w-full rounded-lg border px-2 py-1.5 text-sm", isDed ? "border-red-200 text-red-700" : "border-gray-200")}
                    />
                  </div>

                  <div className="col-span-1 text-right">
                    <button onClick={() => deleteItem(it.id)} className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs text-red-600 hover:bg-red-50" title="Eliminar línea">
                      Eliminar
                    </button>
                  </div>

                  <div className="col-span-12 mt-2 grid grid-cols-12 gap-3">
                    <label className="col-span-3 flex items-center gap-2 text-xs text-gray-600">
                      <input type="checkbox" checked={it.cotizable ?? true} onChange={(e) => updateItem(it.id, { cotizable: e.target.checked })} />
                      Cotizable (base SS)
                    </label>
                    <label className="col-span-3 flex items-center gap-2 text-xs text-gray-600">
                      <input type="checkbox" checked={it.sujeto_irpf ?? true} onChange={(e) => updateItem(it.id, { sujeto_irpf: e.target.checked })} />
                      Sujeto a IRPF
                    </label>
                    <input
                      className="col-span-6 rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
                      placeholder="Notas (opcional)" value={it.notes ?? ""} onChange={(e) => updateItem(it.id, { notes: e.target.value })}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* RESUMENES */}
        <aside className="col-span-5 h-full border-l bg-gray-50">
          <div className="space-y-4 px-4 py-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-gray-800">Parámetros del periodo</h4>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500">IRPF % (trabajador)</label>
                  <input
                    type="number" step="0.01" value={totals.pctIRPF}
                    onChange={(e) => setPeriod((p) => (p ? { ...p, irpf_pct: num(e.target.value, 0) } : p))}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">SS % (trabajador)</label>
                  <input
                    type="number" step="0.01" value={totals.pctSSTrab}
                    onChange={(e) => setPeriod((p) => (p ? { ...p, ss_emp_pct: num(e.target.value, 0) } : p))}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div className="mt-3">
                <button disabled={saving} onClick={savePeriodPercents} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60">
                  {saving ? "Guardando…" : "Guardar parámetros"}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-gray-500">* Sobrescribe los % por defecto del empleado solo para este periodo.</p>
            </div>

            {/* Totales trabajador */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-gray-800">Bases y totales</h4>
              <dl className="mt-3 space-y-1 text-sm">
                <Row k="Base Cotización (SS)" v={toEur(totals.baseCotizacion)} />
                <Row k="Base IRPF" v={toEur(totals.baseIRPF)} />
                <hr className="my-1 border-gray-100" />
                <Row k="Devengos" v={toEur(totals.totalDevengos)} />
                <Row k={`SS trabajador (${fmtPct(totals.pctSSTrab)})`} v={toEur(totals.ssTrab)} />
                <Row k={`IRPF (${fmtPct(totals.pctIRPF)})`} v={toEur(totals.irpf)} />
                <Row k="Deducciones manuales" v={toEur(totals.totalDeduccionesManuales)} />
                <hr className="my-1 border-gray-100" />
                <Row k="Total deducciones" v={toEur(totals.totalDeducciones)} strong />
                <Row k="Neto a percibir" v={toEur(totals.neto)} big />
              </dl>

              {warnings.length > 0 && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                  <div className="font-semibold">Avisos de validación:</div>
                  <ul className="mt-1 list-disc pl-4">
                    {warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {/* Aportación empresa (informativo) */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-gray-800">Aportación empresa (informativo)</h4>
              <dl className="mt-3 space-y-1 text-sm">
                <Row k={`SS empresa (${fmtPct(totals.pctSSEmp)})`} v={toEur(totals.ssEmp)} />
                <Row k="Coste total empresa" v={toEur(totals.totalDevengos + totals.ssEmp)} />
              </dl>
              <p className="mt-2 text-[11px] text-gray-500">* No afecta al neto del trabajador.</p>
            </div>

            {/* Exportación */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-gray-800">Exportación</h4>
              <button
                disabled={pdfState.loading}
                onClick={generatePDF}
                className="mt-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
              >
                {pdfState.loading ? "Generando PDF…" : "Generar PDF"}
              </button>
              {pdfState.msg ? <p className="mt-2 text-xs text-gray-500">{pdfState.msg}</p> : null}
              {pdfState.url ? (
                <a href={pdfState.url} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-blue-600 underline">
                  Ver PDF
                </a>
              ) : null}
            </div>
          </div>
        </aside>
      </div>

      {errorMsg ? <div className="border-t px-4 py-2 text-xs text-red-600">Error: {errorMsg}</div> : null}
    </div>
  );
}

function Row({ k, v, strong, big }: { k: string; v: string; strong?: boolean; big?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={cx("text-gray-600", big && "text-gray-900")}>{k}</dt>
      <dd className={cx("font-medium", strong && "font-semibold", big && "text-base font-bold")}>{v}</dd>
    </div>
  );
}
function toEur(n: number) {
  return (n ?? 0).toLocaleString(undefined, { style: "currency", currency: "EUR" });
}
function fmtPct(n: number) {
  return `${(n ?? 0).toFixed(2)}%`;
}
