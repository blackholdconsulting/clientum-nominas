"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import OrgPickerModal from "@/components/payroll/OrgPickerModal";

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

  const [orgId, setOrgId] = useState<string | null>(sp.get("orgId"));
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerData, setPickerData] = useState<OrgOption[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: memberships } = await supabase.from("org_members").select("org_id").limit(10);
      const ids = (memberships ?? []).map((m: any) => m.org_id).filter(Boolean);
      let options: OrgOption[] = ids.map((id: string) => ({ id, name: id.slice(0, 8) }));
      if (ids.length) {
        const { data: named } = await supabase.from("orgs").select("id,name").in("id", ids);
        if (named && named.length) {
          const map = new Map(named.map((r: any) => [r.id, r.name || r.id.slice(0, 8)]));
          options = ids.map((id: string) => ({ id, name: map.get(id) as string }));
        }
      }
      if (!alive) return;
      setOrgs(options);
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

  const goYear = (y: number) => {
    setYear(y);
    const params = new URLSearchParams(sp);
    params.set("year", String(y));
    if (orgId) params.set("orgId", orgId);
    params.delete("month");
    router.push(`${pathname}?${params.toString()}`);
  };

  const chooseOrg = (id: string | null) => {
    setOrgId(id);
    const params = new URLSearchParams(sp);
    params.set("year", String(year));
    if (id) params.set("orgId", id);
    else params.delete("orgId");
    params.delete("month");
    router.push(`${pathname}?${params.toString()}`);
  };

  const openEditor = (y: number, m: number, org?: string | null) => {
    const params = new URLSearchParams();
    params.set("year", String(y));
    params.set("month", String(m));
    if (org) params.set("orgId", org);
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  // Crear: navegar primero, crear en background
  const createAndOpen = async (forcedOrgId?: string) => {
    const finalOrg = forcedOrgId ?? orgId ?? undefined;

    // 1) Abrimos el editor inmediatamente
    openEditor(year, month, finalOrg);

    // 2) Pedimos creación en segundo plano
    try {
      const res = await fetch("/api/payroll/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ year, month, orgId: finalOrg }),
      });
      const json = await res.json();

      if (res.status === 409 && json.code === "MULTI_ORG" && Array.isArray(json.orgs)) {
        setPickerData(json.orgs as OrgOption[]);
        setPickerOpen(true);
        return;
      }

      if (!res.ok && json?.error) {
        console.warn("Crear nómina (toolbar bg):", json.error);
      }
    } catch (e) {
      console.warn("Crear nómina (toolbar bg):", e);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <GhostLink href="/dashboard">Dashboard</GhostLink>

        {orgs.length > 1 && (
          <select
            value={orgId ?? ""}
            onChange={(e) => chooseOrg(e.target.value || null)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm"
            title="Organización"
          >
            <option value="">Selecciona organización…</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        )}

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

        <Cta type="button" onClick={() => createAndOpen()}>
          Crear nómina
        </Cta>
      </div>

      <OrgPickerModal
        open={pickerOpen}
        orgs={pickerData}
        onCancel={() => setPickerOpen(false)}
        onConfirm={(id) => {
          setPickerOpen(false);
          chooseOrg(id);
          // Reabrimos (por si el usuario cambió de mes) y creamos en bg con la org elegida
          openEditor(year, month, id);
          (async () => {
            try {
              await fetch("/api/payroll/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                cache: "no-store",
                body: JSON.stringify({ year, month, orgId: id }),
              });
            } catch {}
          })();
        }}
      />
    </>
  );
}
