"use client";

import { useTransition } from "react";
import { setEmployeeDepartment } from "@/app/employees/actions";

type Option = { id: string; name: string };

export default function DepartmentSelect({
  employeeId,
  departments,
  currentId,
}: {
  employeeId: string;
  departments: Option[];
  currentId?: string | null;
}) {
  const [pending, start] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const fd = new FormData();
    fd.append("employee_id", employeeId);
    fd.append("department_id", e.target.value || "");
    start(() => setEmployeeDepartment(fd));
  }

  return (
    <select
      className="border rounded-md px-2 py-1 text-sm bg-white"
      defaultValue={currentId ?? ""}
      onChange={onChange}
      disabled={pending}
      aria-label="Seleccionar departamento"
    >
      <option value="">Sin depto.</option>
      {departments.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
    </select>
  );
}
