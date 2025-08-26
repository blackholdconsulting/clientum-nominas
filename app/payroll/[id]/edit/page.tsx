import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import PayrollEditor from "@/components/payroll/PayrollEditor";

type Props = { params: { id: string } };

function createSb() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export default async function Page({ params }: Props) {
  const id = Number(params.id);
  const sb = createSb();

  const { data: payroll, error: e1 } = await sb
    .from("payrolls")
    .select("id, period_year, period_month, status")
    .eq("id", id)
    .single();

  if (e1) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          {e1.message}
        </div>
      </div>
    );
  }

  // Trae items con el nombre del empleado
  const { data: items } = await sb
    .from("payroll_items")
    .select(
      `
        id, payroll_id, employee_id,
        base_gross, irpf_amount, ss_emp_amount, ss_er_amount, net, pdf_url,
        employee:employees(id, full_name)
      `
    )
    .eq("payroll_id", id)
    .order("id", { ascending: true });

  // Trae empleados por si falta crear renglones
  const { data: employees } = await sb
    .from("employees")
    .select("id, full_name")
    .order("full_name", { ascending: true });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-1">
        Editor de nómina {payroll.period_month}/{payroll.period_year}
      </h1>
      <p className="text-sm text-gray-500 mb-6">Estado: {payroll.status}</p>

      <PayrollEditor
        payroll={{
          id: payroll.id,
          year: payroll.period_year,
          month: payroll.period_month,
          status: payroll.status,
        }}
        initialItems={items ?? []}
        employees={employees ?? []}
      />
    </div>
  );
}
