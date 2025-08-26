"use client";

import Link from "next/link";

export default function OpenEditorButton({
  year,
  month,
  label = "Editar nómina",
  create = false, // si true -> ?create=1
  newTab = true,
}: {
  year: number;
  month: number;
  label?: string;
  create?: boolean;
  newTab?: boolean;
}) {
  const href = create
    ? `/payroll/period/${year}/${month}?create=1`
    : `/payroll/period/${year}/${month}`;

  return (
    <Link
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
      prefetch={false}
    >
      {label}
    </Link>
  );
}
