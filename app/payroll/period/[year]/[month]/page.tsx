"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPeriodDraft } from "./actions";

export default function PeriodCreatorPage({
  params,
}: {
  params: { year: string; month: string };
}) {
  const router = useRouter();
  const year = Number(params.year);
  const month = Number(params.month);

  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const onCreate = () => {
    setMsg(null);
    startTransition(async () => {
      const res = await createPeriodDraft(year, month);
      if (res.ok && res.id) {
        // navegamos desde el cliente ⇒ no hay NEXT_REDIRECT
        router.replace(`/payroll/${res.id}/edit`);
      } else {
        setMsg(res.error || "No se pudo crear el borrador.");
      }
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/payroll" className="text-blue-600">← Volver a la lista</Link>
        <h1 className="text-2xl font-semibold mt-2">
          Crear nómina {String(month).padStart(2, "0")}/{year}
        </h1>
      </div>

      {msg && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
          {msg}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onCreate}
          disabled={pending}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {pending ? "Creando…" : "Crear borrador de nómina"}
        </button>
        <Link
          href="/payroll"
          className="px-4 py-2 rounded border"
        >
          Volver a la lista
        </Link>
      </div>
    </div>
  );
}
