"use client";

import React, { useMemo } from "react";

type Props = {
  open: boolean;
  year?: number;
  month?: number;
  onClose: () => void;
};

/**
 * Panel lateral que embebe el editor en un iframe.
 * Carga /payroll/editor?year=YYYY&month=MM dentro del panel.
 */
export default function EditorPanel({ open, year, month, onClose }: Props) {
  const src = useMemo(() => {
    if (!year || !month) return "";
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
      <div
        className="absolute right-0 top-0 h-full w-full max-w-6xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">
            Editor de nómina {month?.toString().padStart(2, "0")}/{year}
          </h2>
        </div>

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
