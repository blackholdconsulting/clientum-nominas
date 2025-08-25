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
      className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-clientum-blue/60 focus:border-clientum-blue disabled:opacity-60"
      defaultValue={currentId ?? ""}
      onChange={onChange}
      disabled={pending}
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
