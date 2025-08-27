"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Employee = {
  id: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  position?: string | null;
};

export default function EmployeesList({ year, month }: { year: number; month: number }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const sp = useSearchParams();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [term, setTerm] = useState("");

  // Cargar empleados (RLS se encarga del multi-tenant)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name, first_name, last_name, email, position")
        .order("first_name", { ascending: true })
        .order("last_name", { ascending: true });

      if (!alive) return;
      if (error) setErr(error.message);
      else setEmployees((data as Employee[]) ?? []);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [supabase]);

  // Filtro simple por nombre/email/puesto
  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      const name =
        (e.full_name ??
          [e.first_name, e.last_name].filter(Boolean).join(" ")) || // () para mezclar ?? con ||
        "Empleado";
      return (
        name.toLowerCase().includes(q) ||
        (e.email ?? "").toLowerCase().includes(q) ||
        (e.position ?? "").toLowerCase().includes(q)
      );
    });
  }, [employees, term]);

  // Abrir en overlay el editor para este empleado (actualizamos la URL base /payroll)
  const openEmployee = (empId: string) => {
    const params = new URLSearchParams(sp);
    params.set("year", String(year));
    params.set("month", String(month));
    params.set("editor", "1"); // asegura overlay abierto
    params.set("employee", empId);
    router.push(`/payroll?${params.toString()}`);
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-gray-800">Empleados</div>
          <div className="text-xs text-gray-500">Multi-tenant (RLS)</div>
        </div>
        <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600">
          {String(month).padStart(2, "0")}/{year}
        </span>
      </div>

      <div className="p-3">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar por nombre, email, puesto…"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-blue-500"
        />
      </div>

      {loading && (
        <div className="px-4 pb-3 text-sm text-gray-500">Cargando empleados…</div>
      )}
      {err && <div className="px-4 pb-3 text-sm text-red-600">Error: {err}</div>}

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && !loading ? (
          <div className="px-4 pb-4 text-sm text-gray-500">Sin resultados.</div>
        ) : (
          <ul className="divide-y">
            {filtered.map((e) => {
              const name =
                (e.full_name ??
                  [e.first_name, e.last_name].filter(Boolean).join(" ")) || "Empleado";
              return (
                <li key={e.id} className="group flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {e.email ?? "—"}{" "}
                      {e.position ? <span className="text-gray-400">· {e.position}</span> : null}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEmployee(e.id)}
                    className="whitespace-nowrap text-[12px] font-medium text-blue-700 opacity-0 transition group-hover:opacity-100"
                    title="Abrir nómina del empleado"
                  >
                    Ver nómina →
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
