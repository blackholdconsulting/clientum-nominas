import Link from 'next/link';
import { createServerClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';

type Props = { params: { year: string; month: string } };

export default async function MonthEditorPage({ params }: Props) {
  const year = Number(params.year);
  const month = Number(params.month);
  if (!year || !month || month < 1 || month > 12) notFound();

  const supabase = await createServerClient();
  const { data: userRes, error: uErr } = await supabase.auth.getUser();
  if (uErr || !userRes?.user) redirect('/login');

  // Trae empleados + su payroll.id del mes (si no existiera, no romperá la página)
  const { data, error } = await supabase
    .from('employees')
    .select(`
      id, full_name, email,
      payrolls:payrolls!inner(id,status,period_year,period_month)
    `)
    .eq('user_id', userRes.user.id)
    .eq('payrolls.period_year', year)
    .eq('payrolls.period_month', month)
    .order('full_name');

  // Si falla la JOIN por RLS, cae a empleados y luego buscamos payroll suelta
  let rows = data;
  if (error) {
    const { data: emps } = await supabase
      .from('employees').select('id,full_name,email').eq('user_id', userRes.user.id);

    const { data: pays } = await supabase
      .from('payrolls').select('id,employee_id,status')
      .eq('user_id', userRes.user.id)
      .eq('period_year', year)
      .eq('period_month', month);

    rows = (emps ?? []).map(e => ({
      ...e,
      payrolls: (pays ?? []).filter(p => p.employee_id === e.id)
    })) as any[];
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Nóminas {month.toString().padStart(2,'0')}/{year}
        </h1>
        <Link href="/payroll" className="underline">Volver</Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(rows ?? []).map((r: any) => {
          const p = r.payrolls?.[0];
          return (
            <div key={r.id} className="rounded-xl border p-4">
              <div className="font-medium">{r.full_name}</div>
              <div className="text-sm text-gray-500">{r.email}</div>
              <div className="mt-2 text-sm">
                Estado: <span className="px-2 py-0.5 rounded bg-gray-100">{p?.status ?? 'draft'}</span>
              </div>

              <div className="mt-4 flex gap-2">
                {p?.id ? (
                  <Link
                    href={`/payroll/${p.id}/edit`}
                    className="px-3 py-1 rounded bg-blue-600 text-white"
                  >
                    Abrir editor
                  </Link>
                ) : (
                  <span className="text-amber-600 text-sm">No se creó el borrador</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
