"use client";

import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string;
  backHref?: string; // por defecto /dashboard
};

export default function PageHeader({ title, subtitle, backHref = "/dashboard" }: Props) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <span aria-hidden>←</span>
          Volver al dashboard
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
        </div>
      </div>
    </div>
  );
}
