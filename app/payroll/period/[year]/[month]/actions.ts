// app/payroll/period/[year]/[month]/actions.ts
"use server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function generateDraft(year: number, month: number) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
      },
    }
  );

  const { data, error } = await supabase.rpc("payroll_generate_period", {
    p_year: year,
    p_month: month,
  });

  if (error) throw new Error(error.message);
  // Espera data: { ok: true, payroll_id: number }
  return data as { ok: boolean; payroll_id: number };
}
