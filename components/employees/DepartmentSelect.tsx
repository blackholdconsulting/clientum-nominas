"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
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

  function clear() {
    const fd = new FormData();
    fd.append("employee_id", employeeId);
    fd.append("department_id", "");
    start(() => setEmployeeDepartment(fd));
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="border rounded-md px-2 py-1 text-sm"
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
      <Button type="button" variant="outline" size="sm" onClick={clear} disabled={pending}>
        Quitar
      </Button>
    </div>
  );
}
