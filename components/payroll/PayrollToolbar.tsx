"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

const MONTHS = [
  "01 · Enero","02 · Febrero","03 · Marzo","04 · Abril","05 · Mayo","06 · Junio",
  "07 · Julio","08 · Agosto","09 · Septiembre","10 · Octubre","11 · Noviembre","12 · Diciembre",
];

function Cta({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={[
        "inline-flex items-center justify-center rounded-xl",
        "bg-gradient-to-r from-[#2563EB] to-[#1E40AF] text-white",
        "px-3.5 py-2 text-sm font-medium shadow-sm ring-1 ring-[#1E40AF]/30",
        "hover:brightness-[1.05] active:translate-y-[0.5px] disabled:opacity-60",
        rest.className || "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function GhostLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      className={[
        "inline-flex items-center rounded-lg border border-gray-300 bg-white",
        "px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50",
        props.className || "",
      ].join(" ")}
    />
  );
}

type OrgOption = { id: string; name: string };

export default function PayrollToolbar({ defaultYear }: { defaultYear: number }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const now = useMemo(() => new Date(), []);
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [year, setYear] = useState<number>(defaultYear ?? now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [busy, setBusy] = useState(false);

  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [orgId, setOrgId] = useState<string | null>(sp.get("orgId"));

  // Cargar organizaciones (RLS por usuario)
  useEffect(() => {
    let alive = true;
    (async () => {
      // 1) org_members -> lista de org_id del usuario
      const { data: memberships, error: mErr } = await supabase
        .from("org_members")
        .select("org_id");
      if (mErr) {
        setOrgs([]);
        return;
      }
      const ids = (memberships ?? []).map((m: any) => m.org_id).filter(Boolean);
      if (!ids.length) {
        setOrgs([]);
        return;
      }
      // 2) orgs -> nombre legible
      const { data: orgRows, error: oErr } = await supabase
        .from("orgs")
        .select("id,name")
        .in("id", ids);
      if (oErr) {
        setOrgs(ids.map((id: string) => ({ id, name: id.slice(0, 8) })));
        return;
      }
      if (!alive) return;
      const options = (orgRows ?? []).map((r: any) => ({ id: r.id as string, name: (r.name as string) || r.id.slice(0,8) }));
      setOrgs(options);
      // Si no hay org seleccionada en URL, y solo hay 1, usarla
      if (!orgId && options.length === 1) {
        setOrgId(options[0].id);
        const params = new URLSearchParams(sp);
        params.set("year", String(year));
        params.set("orgId", options[0].id);
        router.replace(`${pathname}?${params.toString()}`);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Cambiar año -> mantener orgId en URL
  const goYear = (y: number) => {
    setYear(y);
    const params = new URLSearchParams(sp);
    params.set("year", String(y));
    if (orgId) params.set("orgId", orgId);
    params.delete("month"); // cerramos overlay si lo hubiera
    router.push(`${pathname}?${params.toString()}`);
  };

  // Cambiar organización -> fijarla en URL
  const chooseOrg = (id: string) => {
    setOrgId(id || null);
    const params = new URLSearchParams(sp);
    params.set("year", String(year));
    if (id) params.set("orgId", id);
    else params.delete("orgId");
    params.delete("month");
    router.push(`${pathname}?${params.toString()}`);
  };

  const createAndOpen = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/payroll/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ year, month, orgId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        alert(json.error ?? "No se ha podido crear la nómina.");
      } else {
        const params = new URLSearchParams();
        params.set("year", String(year));
        params.set("month", String(month));
        if (orgId) params.set("orgId", orgId);
        router.push(`${pathname}?${params.toString()}`); // abre panel
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Botón volver al dashboard */}
      <GhostLink href="/dashboard">Dashboard</GhostLink>

      {/* Selector de organización (solo si hay varias) */}
      {orgs.length > 1 && (
        <select
          value={orgId ?? ""}
          onChange={(e) => chooseOrg(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm"
          title="Organización"
        >
          <option value="">Selecciona organización…</option>
          {orgs.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      )}

      {/* Mes / Año */}
      <select
        value={month}
        onChange={(e) => setMonth(Number(e.target.value))}
        className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm"
      >
        {MONTHS.map((m, i) => (
          <option key={i + 1} value={i + 1}>{m}</option>
        ))}
      </select>
      <input
        type="number"
        value={year}
        onChange={(e) => goYear(Number(e.target.value))}
        className="w-[92px] rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm"
      />

      {/* CTA crear y abrir */}
      <Cta onClick={createAndOpen} disabled={busy || (orgs.length > 1 && !orgId)}>
        {busy ? "Creando…" : "Crear nómina"}
      </Cta>
    </div>
  );
}
