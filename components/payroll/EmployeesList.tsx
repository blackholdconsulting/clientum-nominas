"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Props = { year: number; month: number };

type Employee = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  position?: string | null;
};

export default function EmployeesList({ year, month }: Props) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [list, setList] = useState<Employee[]>([]);
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);

      // Solo seleccionamos columnas reales (no usamos "name")
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, full_name, email, position")
        .order("first_name", { ascending: true });

      if (!alive) return;
      if (error) {
        setErr(error.message);
      } else {
        setList((data ?? []) as Employee[]);
      }
      setLoading(false);
    })();

    return () => { alive = false; };
  }, [supabase]);

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return list;
    return list.filter((e) => {
      const safeFull =
        (e.full_name !== null && e.full_name !== undefined ? e.full_name : "") as string;
      const safeName =
        safeFull && safeFull.length > 0
          ? safeFull
          : [e.first_name ?? "", e.last_name ?? ""].filter(Boolean).join(" ");
      const email = (e.email ?? "") as string;
      const pos = (e.position ?? "") as string;
      const haystack = `${safeName} ${email} ${pos}`.toLowerCase();
      return haystack.includes(t);
    });
  }, [list, term]);

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar por nombre, email, puesto…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="px-3 pb-3 text-xs text-gray-500">Cargando empleados…</div>
      ) : err ? (
        <div className="px-3 pb-3 text-xs text-red-600">Error: {err}</div>
      ) : filtered.length === 0 ? (
        <div className="px-3 pb-3 text-xs text-gray-500">Sin resultados.</div>
      ) : null}

      <ul className="flex-1 divide-y overflow-auto">
        {filtered.map((e) => {
          const composed =
            (e.full_name && e.full_name.length > 0
              ? e.full_name
              : [e.first_name ?? "", e.last_name ?? ""].filter(Boolean).join(" ")) || "Empleado";
          return (
            <li key={e.id}>
              <a
                href={`/payroll/editor?year=${year}&month=${month}&employee=${e.id}`}
                className="block px-3 py-3 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{composed}</div>
                    <p className="text-xs text-gray-500">{e.email ?? "—"}{e.position ? ` · ${e.position}` : ""}</p>
                  </div>
                  <span className="text-[11px] text-blue-600">Ver nómina →</span>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
