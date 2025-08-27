"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function FloatingEditor() {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();

  const isOpen = sp.get("editor") === "1";
  const y = Number(sp.get("year") ?? new Date().getFullYear());
  const m = Number(sp.get("month") ?? new Date().getMonth() + 1);
  const employee = sp.get("employee") || "";
  const orgId = sp.get("orgId") || "";

  const url = `/payroll/editor?year=${y}&month=${m}${
    employee ? `&employee=${encodeURIComponent(employee)}` : ""
  }${orgId ? `&orgId=${encodeURIComponent(orgId)}` : ""}`;

  // Evitar scroll de fondo cuando está abierto
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const close = () => {
    const params = new URLSearchParams(sp);
    params.delete("editor");
    params.delete("employee");
    router.push(`${pathname}?${params.toString()}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={close}
        aria-hidden
      />

      {/* Sheet derecha */}
      <div className="absolute right-0 top-0 h-full w-[min(1100px,92vw)] bg-white shadow-2xl ring-1 ring-black/10">
        {/* Header */}
        <div className="flex h-12 items-center justify-between border-b px-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-[11px] font-bold text-white">
              {String(m).padStart(2, "0")}
            </span>
            <h3 className="text-sm font-semibold text-gray-900">
              Editor nómina — {String(m).padStart(2, "0")}/{y}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/dashboard"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Dashboard
            </a>
            <button
              onClick={close}
              className="inline-flex items-center rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-95"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Contenido: IFRAME del editor real */}
        <div className="h-[calc(100%-3rem)]">
          <iframe
            src={url}
            className="h-full w-full border-0"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
}
