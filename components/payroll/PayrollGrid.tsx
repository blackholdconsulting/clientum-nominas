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

type Row = { id: string; month: number; status: string | null };
type OrgOption = { id: string; name: string };

export default function PayrollGrid({ year }: { year: number }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const sp = useSearchParams();
  const currentOrgId = sp.get("orgId");

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // modal de organizaciones (fallback)
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

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

  // Cargar orgs para modal bajo demanda
  const loadOrgsIfNeeded = async (): Promise<OrgOption[]> => {
    const { data: memberships } = await supabase.from("org_members").select("org_id").limit(10);
    const ids = (memberships ?? []).map((m: any) => m.org_id).filter(Boolean);
    let opts: OrgOption[] = ids.map((id: string) => ({ id, name: id.slice(0, 8) }));
    if (ids.length) {
      const { data: named } = await supabase.from("orgs").select("id,name").in("id", ids);
      if (named && named.length) {
        const map = new Map(named.map((r: any) => [r.id, r.name || r.id.slice(0, 8)]));
        opts = ids.map((id: string) => ({ id, name: map.get(id) as string }));
      }
    }
    setOrgs(opts);
    return opts;
  };

  const create = async (month: number, forcedOrgId?: string) => {
    const orgId = forcedOrgId ?? currentOrgId;

    const res = await fetch("/api/payroll/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({ year, month, orgId: orgId ?? undefined }),
    });
    const json = await res.json();

    if (!res.ok || !json.ok) {
      const msg = (json.error || "").toLowerCase();
      if (msg.includes("varias organizaciones")) {
        // Abrir modal para que el usuario elija
        const opts = await loadOrgsIfNeeded();
        if (opts.length > 1) {
          setPickerOpen(true);
          return;
        }
        if (opts.length === 1) {
          // Autoselección si sólo hay 1 visible
          return create(month, opts[0].id);
        }
      }
      alert(json.error ?? "No se ha podido crear el período.");
      return;
    }

    const params = new URLSearchParams();
    params.set("year", String(year));
    params.set("month", String(month));
    if (orgId) params.set("orgId", orgId);
    router.push(`/payroll?${params.toString()}`); // abre panel con editor
    router.refresh();
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
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set("year", String(year));
                        params.set("month", String(m));
                        if (currentOrgId) params.set("orgId", currentOrgId);
                        router.push(`/payroll?${params.toString()}`);
                      }}
                      className="inline-flex items-center rounded-xl border border-[#2563EB]/30 bg-white px-3 py-2 text-sm font-medium text-[#1E3A8A] shadow-sm hover:bg-[#EFF6FF]"
                      title="Abrir editor"
                    >
                      Editar nómina
                    </button>
                  ) : (
                    <button
                      onClick={() => create(m)}
                      className="inline-flex items-center rounded-xl border border-[#2563EB]/30 bg-white px-3 py-2 text-sm font-medium text-[#1E3A8A] shadow-sm hover:bg-[#EFF6FF]"
                      title="Crear y abrir editor"
                    >
                      Crear nómina
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal organización (fallback) */}
      <OrgPickerModal
        open={pickerOpen}
        orgs={orgs}
        onCancel={() => setPickerOpen(false)}
        onConfirm={(id) => {
          setPickerOpen(false);
          // guardamos orgId en la URL y reintentamos
          const params = new URLSearchParams(sp);
          params.set("year", String(year));
          params.set("orgId", id);
          router.replace(`/payroll?${params.toString()}`);
          // damos un tick y creamos con ese id
          setTimeout(() => {
            create(Number(sp.get("month") || 0) || new Date().getMonth() + 1, id);
          }, 0);
        }}
      />
    </>
  );
}
