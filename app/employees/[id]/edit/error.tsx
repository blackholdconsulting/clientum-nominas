"use client";

export default function EditEmployeeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md mt-10 rounded-lg border p-6 text-center">
      <h2 className="text-lg font-semibold mb-2">Ha ocurrido un error</h2>
      <p className="text-sm text-slate-600 mb-4">
        Hemos tenido un problema cargando esta página.
      </p>

      {/* Mostramos el mensaje real también en producción para depurar */}
      <p className="text-xs text-red-600 mb-4 break-all">
        {error?.message || String(error)}
      </p>

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
