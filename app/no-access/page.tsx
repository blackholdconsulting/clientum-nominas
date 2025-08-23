export const dynamic = "force-dynamic";

export default function NoAccess() {
  return (
    <div className="min-h-screen grid place-items-center p-8">
      <div className="max-w-lg w-full rounded-2xl border bg-white p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Nóminas no incluido en tu plan</h1>
        <p className="text-slate-600">
          Tu empresa no tiene Clientum PRO activo. Contacta con tu
          administrador o actualiza el plan desde el ERP.
        </p>
        <a
          href="https://app.clientum.es/billing" /* ajusta */
          className="inline-block mt-2 px-4 py-2 rounded-md bg-[#0E7AFE] text-white"
        >
          Ir a facturación
        </a>
      </div>
    </div>
  );
}
