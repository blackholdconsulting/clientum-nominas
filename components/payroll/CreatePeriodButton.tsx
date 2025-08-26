"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatePeriodButton({ defaultYear, defaultMonth }: { defaultYear?: number; defaultMonth?: number }) {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState<number>(defaultYear ?? now.getFullYear());
  const [month, setMonth] = useState<number>(defaultMonth ?? (now.getMonth() + 1));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  const months = [
    "01 · Enero","02 · Febrero","03 · Marzo","04 · Abril","05 · Mayo","06 · Junio",
    "07 · Julio","08 · Agosto","09 · Septiembre","10 · Octubre","11 · Noviembre","12 · Diciembre",
  ];

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/payroll/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setMsg(json.error ?? "No se ha podido crear el periodo.");
      } else {
        setMsg("Nómina creada.");
        router.refresh(); // recargar lista
      }
    } catch (e: any) {
      setMsg(e.message ?? "Error de red.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={month}
        onChange={(e) => setMonth(Number(e.target.value))}
        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
      >
        {months.map((label, idx) => (
          <option key={idx + 1} value={idx + 1}>{label}</option>
        ))}
      </select>

      <input
        type="number"
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        className="w-[90px] rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
      />

      <button
        onClick={submit}
        disabled={busy}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
        title="Crea el periodo de nómina si no existe"
      >
        {busy ? "Creando…" : "Crear nómina"}
      </button>

      {msg ? <span className="text-xs text-gray-500">{msg}</span> : null}
    </div>
  );
}

