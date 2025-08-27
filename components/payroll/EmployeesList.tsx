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

  // Cargar empleados (RLS multi-tenant)
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
    return () => { alive = false; };
  }, [supabase]);

  // Búsqueda local
  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      const name =
        (e.full_name ??
          [e.first_name, e.last_name].filter(Boolean).join(" ")) ||
        "Empleado"; // () para mezclar ?? con ||
      return (
        name.toLowerCase().includes(q) ||
        (e.email ?? "").toLowerCase().includes(q) ||
        (e.position ?? "").toLowerCase().includes(q)
      );
    });
  }, [employees, term]);

  // Abrir nómina de un empleado DENTRO del iframe (ruta /payroll/editor)
  const openEmployee = (empId: string) => {
    const orgId = sp.get("orgId");
    const params = new URLSearchParams();
    params.set("year", String(year));
    params.set("month", String(month));
    params.set("employee", empId);
    if (orgId) params.set("orgId", orgId);

    // MUY IMPORTANTE: navegamos dentro del iframe a /payroll/editor (NO a /payroll)
    router.push(`/payroll/editor?${params.toString()}`);
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

      {loading && <div className="px-4 pb-3 text-sm text-gray-500">Cargando empleados…</div>}
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
              const subtitle = [e.email ?? "", e.position ?? ""].filter(Boolean).join(" · ");
              return (
                <li key={e.id}>
                  {/* Toda la fila es clicable */}
                  <button
                    type="button"
                    onClick={() => openEmployee(e.id)}
                    className="group block w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50"
                    title="Abrir nómina del empleado"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{name}</p>
                        <p className="truncate text-xs text-gray-500">{subtitle || "—"}</p>
                      </div>
                      <span className="ml-3 shrink-0 text-[12px] font-medium text-blue-700">
                        Ver nómina →
                      </span>
                    </div>
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
