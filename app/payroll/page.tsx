import { createSupabaseServer } from "@/utils/supabase/server";
import Link from "next/link";
import { generatePayroll } from "./actions";

export default async function PayrollPage() {
  const supabase = createSupabaseServer();
  const { data: rows } = await supabase
    .from("payrolls")
    .select("*")
    .order("period_year",{ascending:false})
    .order("period_month",{ascending:false})
    .limit(24);

  async function onGenerate(formData: FormData) {
    "use server";
    const year = Number(formData.get("year"));
    const month = Number(formData.get("month"));
    await generatePayroll(year, month);
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Gestión de Nóminas</h1>
        <form action={onGenerate} className="flex gap-2">
          <select name="month" className="border rounded px-2 py-1">
            {Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}</option>)}
          </select>
          <input name="year" className="border rounded px-2 py-1 w-24" defaultValue={new Date().getFullYear()} />
          <button className="bg-[#1061FE] text-white px-4 py-1 rounded">Nueva nómina</button>
        </form>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(rows ?? []).map(p => (
          <Link
            key={p.id}
            href={`/payroll/${p.period_year}/${p.period_month}`}
            className="border rounded-lg p-4 hover:shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Periodo</div>
                <div className="text-lg font-semibold">{p.period_month}/{p.period_year}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Neto</div>
                <div className="text-lg font-semibold">{Number(p.net_total).toFixed(2)} €</div>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">Estado: {p.status}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
