import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseServerClient();
  const out: any = { env: {}, steps: [] };

  // variables
  out.env.hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  out.env.hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // auth.getUser
  try {
    const { data, error } = await supabase.auth.getUser();
    out.steps.push({
      name: "auth.getUser",
      ok: !error,
      error: error?.message,
      userId: data?.user?.id ?? null,
    });
  } catch (e: any) {
    out.steps.push({ name: "auth.getUser", ok: false, error: e?.message || String(e) });
  }

  // nominas_employees
  try {
    const { data, error } = await supabase
      .from("nominas_employees")
      .select("id")
      .limit(1);
    out.steps.push({
      name: "select nominas_employees",
      ok: !error,
      error: error?.message,
      rows: data?.length ?? 0,
    });
  } catch (e: any) {
    out.steps.push({ name: "select nominas_employees", ok: false, error: e?.message || String(e) });
  }

  // employees fallback
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("id")
      .limit(1);
    out.steps.push({
      name: "select employees",
      ok: !error,
      error: error?.message,
      rows: data?.length ?? 0,
    });
  } catch (e: any) {
    out.steps.push({ name: "select employees", ok: false, error: e?.message || String(e) });
  }

  return NextResponse.json(out, { status: 200 });
}
