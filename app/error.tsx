// app/error.tsx
'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // útil para ver algo en logs del navegador
    // y en plataformas que capturan console.error
    // (Render muestra el digest en logs del server)
    console.error('GlobalError:', error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen grid place-items-center p-6">
        <div className="max-w-xl w-full rounded-2xl border bg-white p-6 shadow">
          <h2 className="text-lg font-semibold mb-2">Ha ocurrido un error</h2>
          <p className="text-sm text-gray-600 mb-4">
            {error.message || 'Error en el render del servidor.'}
          </p>
          {error.digest && (
            <p className="text-xs text-gray-400 mb-4">
              Digest: <code>{error.digest}</code>
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => reset()}
              className="rounded-lg px-3 py-2 bg-emerald-700 text-white hover:bg-emerald-800"
            >
              Reintentar
            </button>
            <a
              href="/"
              className="rounded-lg px-3 py-2 border hover:bg-gray-50"
            >
              Ir al inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
