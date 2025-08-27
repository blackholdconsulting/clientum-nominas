"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import CreateMonthInlineButton from "@/components/payroll/CreateMonthInlineButton";

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function chip(status?: string | null) {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700 border-gray-200",
    closed: "bg-amber-100 text-amber-800 border-amber-200",
    paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return `inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${map[status ?? "draft"] ?? map.draft}`;
}
function chipLabel(status?: string | null) {
  const map: Record<string, string> = { draft: "Borrador", closed: "Cerrada", paid: "Pagada" };
  return map[status ?? "draft"] ?? "Borrador";
}

type Row = { id: string; month: number; status: string | null };

export default function PayrollGrid({ year }: { year: number }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from("payrolls")
        .select("id, month, status")
        .eq("year", year);
      if (!alive) return;
      if (error) setErr(error.message);
      else setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [supabase, year]);

  const byMonth = useMemo(() => {
    const m = new Map<number, Row>();
    for (const r of rows) if (!m.has(r.month)) m.set(r.month, r);
    return m;
  }, [rows]);

  return (
    <>
      {loading ? (
        <div className="text-sm text-gray-500">Cargando periodos…</div>
      ) : err ? (
        <div className="text-sm text-red-600">Error: {err}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 12 }).map((_, i) => {
          const month = i + 1;
          const rec = byMonth.get(month) || null;
          const exists = !!rec;
          const status = rec?.status ?? null;
          const mm = String(month).padStart(2, "0");

          return (
            <div key={month} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">{MONTHS[i]}</div>
                <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600">
                  {mm}/{year}
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-5 text-gray-600">
                Prepara, revisa y guarda las nóminas de tu equipo para este mes.
              </p>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {exists ? <span className={chip(status)}>{chipLabel(status)}</span> : "Sin nómina"}
                </div>
                {exists ? (
                  <button
                    onClick={() => router.push(`/payroll?year=${year}&month=${month}`)}
                    className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-50"
                  >
                    Editar nómina
                  </button>
                ) : (
                  <CreateMonthInlineButton year={year} month={month} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
