// app/payroll/page.tsx
import Link from "next/link";
import { Plus, Calendar, Users, Euro, Receipt } from "lucide-react";

export default async function PayrollPage() {
  // Valores placeholder para no romper el estilo si tu esquema aún no tiene columnas
  const totalEmployees = 0;
  const grossTotal = 0;
  const netTotal = 0;
  const nextPaymentLabel = "–";

  return (
    <main className="min-h-screen w-full bg-[#EEF4FF]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#111827]">
              Gestión de Nóminas
            </h1>
            <p className="mt-1 text-sm text-[#4B5563]">
              Procesa y gestiona las nóminas de tus empleados
            </p>
          </div>

          <Link
            href="/payroll/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B62F6] px-4 py-2.5 text-white shadow-sm ring-1 ring-inset ring-[#0B62F6]/20 hover:bg-[#0854D6] transition"
          >
            <Plus className="h-4 w-4" />
            Nueva Nómina
          </Link>
        </div>

        {/* KPI Cards */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total empleados */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#6B7280]">Total Empleados</p>
              <Users className="h-5 w-5 text-[#0B62F6]" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-[#111827]">
              {totalEmployees}
            </p>
          </div>

          {/* Nómina Bruta */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#6B7280]">Nómina Bruta</p>
              <Euro className="h-5 w-5 text-[#0B62F6]" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-[#111827]">
              {grossTotal.toLocaleString("es-ES", {
                style: "currency",
                currency: "EUR",
              })}
            </p>
          </div>

          {/* Nómina Neta */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#6B7280]">Nómina Neta</p>
              <Receipt className="h-5 w-5 text-[#0B62F6]" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-[#111827]">
              {netTotal.toLocaleString("es-ES", {
                style: "currency",
                currency: "EUR",
              })}
            </p>
          </div>

          {/* Próximo pago */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#6B7280]">Próximo Pago</p>
              <Calendar className="h-5 w-5 text-[#0B62F6]" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-[#111827]">
              {nextPaymentLabel}
            </p>
          </div>
        </section>

        {/* Filtros */}
        <section className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1 rounded-xl bg-white p-2 pl-4 shadow-sm ring-1 ring-black/5">
            <input
              type="text"
              placeholder="Buscar por periodo…"
              className="w-full bg-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
            />
          </div>

          <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-black/5">
            <select className="w-full rounded-lg bg-transparent px-3 py-2 text-sm text-[#111827] focus:outline-none">
              <option>Todos los estados</option>
              <option>Procesada</option>
              <option>Pagada</option>
              <option>Pendiente</option>
            </select>
          </div>

          <button
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#0B62F6] shadow-sm ring-1 ring-[#0B62F6]/20 hover:bg-[#0B62F6] hover:text-white transition"
            type="button"
          >
            Filtrar
          </button>
        </section>

        {/* Lista / Empty state */}
        <section className="mt-6 rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-medium text-[#6B7280]">
            Aún no tienes nóminas creadas.
          </p>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            Haz clic en <span className="font-semibold text-[#0B62F6]">“Nueva Nómina”</span> para empezar.
          </p>
        </section>
      </div>
    </main>
  );
}

