export const dynamic = "force-dynamic";
export const revalidate = 0;

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import PayrollToolbar from "@/components/payroll/PayrollToolbar";
import PayrollGrid from "@/components/payroll/PayrollGrid";
import FloatingEditor from "@/components/payroll/FloatingEditor";

function getSupabaseServerSafe() {
  try {
    const cookieStore = cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (!url || !key) return null;
    return createServerClient(url, key, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    });
  } catch {
    return null;
  }
}

export default async function PayrollPage({
  searchParams,
}: {
  searchParams?: { year?: string };
}) {
  const now = new Date();
  const defaultYear = Number(searchParams?.year || now.getFullYear());

  return (
    <div className="flex h-[100dvh]">
      {/* Columna principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Nóminas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Prepara, revisa y guarda las nóminas de tu equipo.
          </p>

          <div className="mt-3">
            <PayrollToolbar defaultYear={defaultYear} />
          </div>

          <div className="mt-4">
            <PayrollGrid year={defaultYear} />
          </div>
        </div>
      </div>

      {/* Panel lateral que ya tenías (empleados) seguirá renderizado
          desde tus componentes existentes (si lo tenías en esta página). */}

      {/* === PESTAÑA FLOTANTE DEL EDITOR === */}
      <FloatingEditor />
    </div>
  );
}
