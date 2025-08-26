"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Props = {
  year: number;
  month: number;
  onCreated?: () => void; // opcional (p.ej. abrir tu panel de edición)
};

export default function CreatePeriodButton({ year, month, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setMsg(null);
    const supabase = supabaseBrowser();

    // 1º intento: firma {year, month}
    let { error } = await supabase.rpc("payroll_generate_period", { year, month });

    // 2º intento: firma {p_year, p_month}
    if (error) {
      const retry = await supabase.rpc("payroll_generate_period", { p_year: year, p_month: month });
      error = retry.error ?? null;
    }

    if (error) {
      setMsg(error.message);
    } else {
      setMsg("Periodo creado correctamente.");
      onCreated?.();
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-end">
      <button
        disabled={loading}
        onClick={run}
        className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        title="Crear período de nómina para este mes"
      >
        {loading ? "Creando…" : "Crear período"}
      </button>
      {msg ? <span className="mt-1 text-xs text-gray-500">{msg}</span> : null}
    </div>
  );
}
