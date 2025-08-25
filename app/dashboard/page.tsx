import Link from "next/link";
import BackButton from "@/components/BackButton";
import { Users, ReceiptText, FileText, Building2, Settings, Folder, Rocket, ChevronRight } from "lucide-react";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type LastPayroll = { id: string; run_date: string | null };

async function getData() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
      global: { headers: { "x-forwarded-host": (await headers()).get("host") ?? "" } },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { employees: 0, last: null as LastPayroll | null };

  const [{ count: employees }, { data: last }] = await Promise.all([
    supabase.from("employees").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("active", true),
    supabase.from("payroll_runs").select("id, run_date").eq("user_id", user.id).order("run_date", { ascending: false }).limit(1).maybeSingle<LastPayroll>(),
  ]);

  return { employees: employees ?? 0, last: last ?? null };
}

export default async function DashboardPage() {
  const { employees, last } = await getData();

  const shortcuts = [
    { title: "Empleados", href: "/employees", icon: <Users className="size-5" /> },
    { title: "Nóminas", href: "/payroll", icon: <ReceiptText className="size-5" /> },
    { title: "Plantillas", href: "/contracts/models", icon: <FileText className="size-5" /> },
    { title: "Empresas", href: "/org/select", icon: <Building2 className="size-5" /> },
    { title: "Documentos", href: "/documents", icon: <Folder className="size-5" /> }, // si existe
    { title: "Ajustes", href: "/settings", icon: <Settings className="size-5" /> },   // si existe
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-4">
        <BackButton />
      </div>

      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Bienvenido a Clientum</h1>
        <p className="text-slate-600 mt-1">Resumen de nóminas y accesos rápidos.</p>
      </header>

      {/* KPIs azules */}
      <section className="grid gap-5 md:grid-cols-3">
        <BlueCard title="Empleados activos" value={employees.toString()} helper="Total en tu organización">
          <Users className="size-6 opacity-90" />
        </BlueCard>

        <BlueCard
          title="Última nómina"
          value={last?.run_date ? new Date(last.run_date).toLocaleDateString() : "—"}
          helper={last ? "Fecha de última ejecución" : "Sin registros"}
        >
          <ReceiptText className="size-6 opacity-90" />
        </BlueCard>

        <div className="rounded-xl bg-clientum-blue text-white shadow-clientum p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm/5 font-medium text-white/90">Acciones rápidas</h3>
              <p className="text-white/80 mt-1">Gestiona empleados y plantillas</p>
            </div>
            <Rocket className="size-6" />
          </div>
          <div className="mt-4 flex gap-3">
            <Link
              href="/employees"
              className="inline-flex items-center gap-2 rounded-lg bg-white text-clientum-blue px-3 py-1.5 text-sm font-semibold hover:bg-slate-100 transition"
            >
              Empleados <ChevronRight className="size-4" />
            </Link>
            <Link
              href="/contracts/models"
              className="inline-flex items-center gap-2 rounded-lg border border-white/60 px-3 py-1.5 text-sm font-medium text-white hover:bg-clientum-blueDark transition"
            >
              Plantillas <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Accesos a toda la web */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Accesos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group rounded-xl bg-clientum-blue text-white p-4 shadow-clientum hover:-translate-y-0.5 transition"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/15 p-2">{s.icon}</div>
                <div className="font-semibold">{s.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

/* ---------- Card primaria azul  ---------- */
function BlueCard({
  title, value, helper, children,
}: {
  title: string; value: string; helper?: string; children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-clientum-blue text-white shadow-clientum p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm/5 font-medium text-white/90">{title}</h3>
          <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
          {helper && <p className="mt-1 text-white/80 text-sm">{helper}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
