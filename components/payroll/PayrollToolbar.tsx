"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const MONTHS = [
  "01 · Enero","02 · Febrero","03 · Marzo","04 · Abril","05 · Mayo","06 · Junio",
  "07 · Julio","08 · Agosto","09 · Septiembre","10 · Octubre","11 · Noviembre","12 · Diciembre",
];

// Boton primario estilo Clientum (azules corporativos)
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

export default function PayrollToolbar({ defaultYear }: { defaultYear: number }) {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState<number>(defaultYear ?? now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const goYear = (y: number) => {
    setYear(y);
    router.push(`/payroll?year=${y}`);
  };

  const createAndOpen = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/payroll/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ year, month }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        alert(json.error ?? "No se ha podido crear la nómina.");
      } else {
        router.push(`/payroll?year=${year}&month=${month}`); // abre panel editor
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
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
      <Cta onClick={createAndOpen} disabled={busy}>
        {busy ? "Creando…" : "Crear nómina"}
      </Cta>
    </div>
  );
}
