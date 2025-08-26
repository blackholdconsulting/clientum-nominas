'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <h2 className="text-lg font-semibold">Ha ocurrido un error</h2>
        <p className="mt-2 text-sm opacity-80">
          {error?.message || 'No se pudo cargar el editor.'}
        </p>
        {error?.digest && (
          <p className="mt-2 text-xs opacity-60">Digest: {error.digest}</p>
        )}
        <button
          onClick={() => reset()}
          className="mt-4 rounded-md bg-red-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
