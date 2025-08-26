// ⚠️ Esta página necesita auth/cookies → forzamos SSR
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { ensurePayrollPeriod } from './actions';

export default async function PeriodPage({ params }: { params: { year: string; month: string } }) {
  const year = Number(params.year);
  const month = Number(params.month);

  try {
    const payrollId = await ensurePayrollPeriod({ year, month });
    // vamos directos al editor
    redirect(`/payroll/${payrollId}/edit`);
  } catch (err) {
    console.error('ensurePayrollPeriod error', err);
    // si no hay empleados, llévalo a empleados con un aviso suave
    redirect(`/employees?setup=payroll`);
  }
}
