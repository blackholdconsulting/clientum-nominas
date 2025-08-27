"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import OrgPickerModal from "@/components/payroll/OrgPickerModal";

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function StatusChip({ status }: { status?: string | null }) {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700 border-gray-200",
    closed: "bg-amber-100 text-amber-800 border-amber-200",
    paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  const label: Record<string, string> = { draft: "Borrador", closed: "Cerrada", paid: "Pagada" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${map[status ?? "draft"]}`}>
      {label[status ?? "draft"]}
    </span>
  );
}

type RawRow = {
  id: string;
  month?: number | null;
  period_month?: number | null;
  status: string | null;
};
type Row = { id: string; month: number; status: string | null };
type OrgOption = { id: string; name: string };

export default function PayrollGrid({ year }: { year: number }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const sp = useSearchParams();
  const urlOrgId = sp.get("orgId");

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // estado para crear & modal multi-org
  const [busyFor, setBusyFor] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerData, setPickerData] = useState<OrgOption[]>([]);
  const [pendingMonth, setPendingMonth] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);

      // Intento 1: year/month
      let q = await supabase
        .from("payrolls")
        .select("id, month, status")
        .eq("year", year);

      let data: RawRow[] | null = null;
      if (!q.error) data = (q.data as RawRow[]) ?? null;

      // Intento 2: period_year/period_month
      if (!data || data.length === 0) {
        q = await supabase
          .from("payrolls")
          .select("id, period_month, status")
          .eq("period_year", year);
        if (!q.error) data = (q.data as RawRow[]) ?? null;
      }

      if (!alive) return;
      if (q.error) setErr(q.error.message);
      else {
        const mapped: Row[] = (data ?? []).map((r) => ({
          id: r.id,
          month: (r.month ?? r.period_month ?? 0) as number,
          status: r.status ?? null,
        }));
        setRows(mapped);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [supabase, year]);

  const byMonth = useMemo(() => {
    const m = new Map<number, Row>();
    for (const r of rows) if (!m.has(r.month)) m.set(r.month, r);
    return m;
  }, [rows]);

  const openEditor = (y: number, m: number, orgId?: string | null) => {
    const params = new URLSearchParams();
    params.set("year", String(y));
    params.set("month", String(m));
    if (orgId) params.set("orgId", orgId);
    router.push(`/payroll?${params.toString()}`);
    router.refresh();
  };

  const createAndOpen = async (m: number, forcedOrgId?: string) => {
    setBusyFor(m);
    try {
      const orgId = forcedOrgId ?? urlOrgId ?? undefined;

      const res = await fetch("/api/payroll/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ year, month: m, orgId }),
      });
      const json = await res.json();

      if (res.status === 409 && json.code === "MULTI_ORG" && Array.isArray(json.orgs)) {
        // pedir selección de organización y reintentar
        setPendingMonth(m);
        setPickerData(json.orgs as OrgOption[]);
        setPickerOpen(true);
        return;
      }

      // Si la API dice ok/created o ok/ya existía → abrir siempre el editor
      if (res.ok && (json.ok || json.id)) {
        openEditor(year, m, orgId);
        return;
      }

      // Para cualquier otro caso, intentamos abrir el editor igualmente: si no existe, la pantalla lo dirá.
      openEditor(year, m, orgId);
      if (json?.error) console.warn("Crear nómina:", json.error);
    } finally {
      setBusyFor(null);
    }
  };

  return (
    <>
      {loading ? <div className="text-sm text-gray-500">Cargando períodos…</div> : null}
      {err ? <div className="text-sm text-red-600">Error: {err}</div> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 12 }).map((_, i) => {
          const m = i + 1;
          const mm = String(m).padStart(2, "0");
          const rec = byMonth.get(m) || null;
          const exists = !!rec;

          return (
            <div key={m} className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2563EB] to-[#1E40AF]" />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-gray-900">{MONTHS[i]}</h3>
                  <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600">
                    {mm}/{year}
                  </span>
                </div>

                <p className="mt-2 text-[13px] leading-5 text-gray-600">
                  Prepara, revisa y guarda las nóminas de tu equipo para este mes.
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {exists ? <StatusChip status={rec?.status} /> : "Sin nómina"}
                  </div>

                  {exists ? (
                    <button
                      onClick={() => openEditor(year, m, urlOrgId)}
                      className="inline-flex items-center rounded-xl border border-[#2563EB]/30 bg-white px-3 py-2 text-sm font-medium text-[#1E3A8A] shadow-sm hover:bg-[#EFF6FF]"
                      title="Abrir editor"
                    >
                      Editar nómina
                    </button>
                  ) : (
                    <button
                      onClick={() => createAndOpen(m)}
                      disabled={busyFor === m}
                      className="inline-flex items-center rounded-xl border border-[#2563EB]/30 bg-white px-3 py-2 text-sm font-medium text-[#1E3A8A] shadow-sm hover:bg-[#EFF6FF] disabled:opacity-50"
                      title="Crear y abrir editor"
                    >
                      {busyFor === m ? "Creando…" : "Crear nómina"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal organización (si aplica) */}
      <OrgPickerModal
        open={pickerOpen}
        orgs={pickerData}
        onCancel={() => {
          setPickerOpen(false);
          setPendingMonth(null);
        }}
        onConfirm={(id) => {
          setPickerOpen(false);
          if (pendingMonth) createAndOpen(pendingMonth, id);
        }}
      />
    </>
  );
}
