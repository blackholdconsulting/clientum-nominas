"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function DeleteEmployeeButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function onDelete() {
    if (!confirm("¿Seguro que quieres eliminar este empleado?")) return;

    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "No se pudo eliminar el empleado");
      }
      startTransition(() => {
        router.refresh(); // refresca la tabla
      });
    } catch (e: any) {
      alert(e?.message || "Error al eliminar");
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={isPending}
      className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
    >
      {isPending ? "Eliminando…" : "Eliminar"}
    </button>
  );
}
