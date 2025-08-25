"use client";

export default function ErrorEmployees({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log en consola para ver el error real en el navegador
  if (typeof window !== "undefined") console.error("[/employees] error:", error);

  return (
    <div className="mx-auto max-w-md mt-10 rounded-lg border p-6 text-center">
      <h2 className="text-lg font-semibold mb-2">Ha ocurrido un error</h2>
      <p className="text-sm text-slate-600 mb-4">
        Hemos tenido un problema cargando esta página.
      </p>

      {/* En desarrollo mostramos el mensaje */}
      {process.env.NODE_ENV !== "production" && (
        <p className="text-xs text-red-600 mb-4 break-all">
          {error?.message || String(error)}
        </p>
      )}

      <div className="flex justify-center gap-2">
        <button
          onClick={() => reset()}
          className="rounded-md bg-clientum-blue hover:bg-clientum-blueDark text-white px-3 py-2 text-sm"
        >
          Reintentar
        </button>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          Recargar
        </button>
      </div>
    </div>
  );
}
