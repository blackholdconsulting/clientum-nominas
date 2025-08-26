"use client";

import { useMemo } from "react";

type Props = {
  open: boolean;
  year?: number;
  month?: number;
  onClose: () => void;
};

/**
 * Panel lateral que embebe el editor en un iframe.
 * Lo usamos desde la página de nóminas para no cambiar tu editor.
 */
export default function EditorPanel({ open, year, month, onClose }: Props) {
  const src = useMemo(() => {
    if (!year || !month) return "";
    // Carga el editor REAL en el panel (no una nueva pestaña)
    return `/payroll/editor?year=${year}&month=${month}`;
  }, [year, month]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {/* Detenemos el click para que no cierre si pinchas dentro del panel */}
      <div
        className="absolute right-0 top-0 h-full w-full max-w-6xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">
            Editor de nómina {month?.toString().padStart(2, "0")}/{year}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>

        {/* El editor se embebe aquí */}
        {src ? (
          <iframe
            src={src}
            title="Payroll editor"
            className="h-[calc(100%-49px)] w-full"
          />
        ) : (
          <div className="flex h-[calc(100%-49px)] items-center justify-center text-sm text-gray-500">
            Cargando…
          </div>
        )}
      </div>
    </div>
  );
}
