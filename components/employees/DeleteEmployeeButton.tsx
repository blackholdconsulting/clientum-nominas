"use client";

import { deleteEmployee } from "@/app/employees/actions";
import { useTransition } from "react";

export default function DeleteEmployeeButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  // Ligamos la server action con el id en el servidor
  const action = deleteEmployee.bind(null, id);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        // confirmación básica en cliente
        const ok = confirm("¿Seguro que quieres eliminar este empleado?");
        if (!ok) e.preventDefault();
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        {isPending ? "Eliminando…" : "Eliminar"}
      </button>
    </form>
  );
}
