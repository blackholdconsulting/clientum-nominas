"use client";

import { useTransition } from "react";
import { deleteEmployee } from "@/app/employees/actions";

export default function DeleteEmployeeButton({ id }: { id: string }) {
  const [pending, start] = useTransition();

  function onClick() {
    if (!confirm("¿Eliminar este empleado? Esta acción no se puede deshacer.")) return;
    const fd = new FormData();
    fd.append("employee_id", id);
    start(() => deleteEmployee(fd));
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
    >
      Eliminar
    </button>
  );
}
