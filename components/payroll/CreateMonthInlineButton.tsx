"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateMonthInlineButton({ year, month }: { year: number; month: number }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  const submit = async () => {
    setBusy(true);
    setMsg(null);
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
        setMsg(json.error ?? "Error");
      } else {
        router.push(`/payroll?year=${year}&month=${month}`); // abre panel
        router.refresh();
      }
    } catch (e: any) {
      setMsg(e.message ?? "Error de red.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={submit}
      disabled={busy}
      className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:opacity-60"
      title="Crear nómina del mes"
    >
      {busy ? "Creando…" : "Crear nómina"}
    </button>
  );
}
