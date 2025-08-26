"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export type Employee = {
  id: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  position?: string | null;
  job_title?: string | null;
  // multi-tenant (si aplicara)
  org_id?: string | null;
  organization_id?: string | null;
};

type Props = {
  activeOrgId?: string;
  onSelect?: (employee: Employee) => void;
  title?: string;
};

export default function EmployeesList({ activeOrgId, onSelect, title = "Empleados" }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setErrorMsg(null);
      const supabase = supabaseBrowser();

      // Importante: solo ordenamos por columnas que EXISTEN en tu tabla.
      let query = supabase
        .from("employees")
        .select("*")
        .order("full_name", { ascending: true, nullsFirst: true });

      if (activeOrgId) {
        query = query.or(`org_id.eq.${activeOrgId},organization_id.eq.${activeOrgId}`);
      }

      const { data, error } = await query;
      if (error) {
        setErrorMsg(error.message);
        setEmployees([]);
      } else {
        setEmployees((data ?? []) as Employee[]);
      }
      setLoading(false);
    };

    fetchEmployees();
  }, [activeOrgId]);

  // Nombre calculado (full_name -> first+last)
  const withDisplayName = useMemo(() => {
    return employees.map((e) => {
      const displayName =
        (e.full_name ??
          [e.first_name, e.last_name].filter(Boolean).join(" ")) ||
        "Empleado sin nombre";
      return { ...e, __displayName: displayName };
    });
  }, [employees]);

  // Búsqueda + orden en cliente (por si hay full_name nulo)
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let rows = withDisplayName.slice().sort((a, b) =>
      a.__displayName!.localeCompare(b.__displayName!)
    );
    if (!term) return rows;
    return rows.filter((e) => {
      const name = e.__displayName ?? "";
      return (
        name.toLowerCase().includes(term) ||
        (e.email?.toLowerCase().includes(term) ?? false) ||
        (e.position?.toLowerCase().includes(term) ?? false) ||
        (e.job_title?.toLowerCase().includes(term) ?? false)
      );
    });
  }, [q, withDisplayName]);

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-4">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <div className="mt-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, email, puesto…"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
          Cargando empleados…
        </div>
      ) : errorMsg ? (
        <div className="p-4 text-sm text-red-600">Error: {errorMsg}</div>
      ) : filtered.length === 0 ? (
        <div className="p-4 text-sm text-gray-500">No hay empleados</div>
      ) : (
        <ul className="mt-2 flex-1 overflow-auto px-2 pb-2">
          {filtered.map((e) => {
            const displayName = (e as any).__displayName as string;
            const secondary = e.job_title ?? e.position ?? "—";
            return (
              <li
                key={e.id}
                className="group mb-2 cursor-pointer rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm hover:border-blue-400 hover:shadow"
                onClick={() => onSelect?.(e)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-500">{secondary}</p>
                    {e.email ? <p className="text-xs text-gray-400">{e.email}</p> : null}
                  </div>
                  <span className="text-xs text-blue-600 opacity-0 transition group-hover:opacity-100">
                    Ver nómina →
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
