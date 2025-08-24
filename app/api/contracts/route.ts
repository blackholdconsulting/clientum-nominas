// app/api/contracts/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { hardRequireUser } from "@/lib/auth";

export async function GET() {
  const { user, supabase } = await hardRequireUser("/contracts");

  try {
    const { data, error } = await supabase
      .from("contracts")
      .select(`
        id,
        user_id,
        employee_id,
        type,
        position,
        department,
        start_date,
        end_date,
        salary,
        status,
        renewal_date,
        created_at,
        updated_at,
        employees:employee_id ( first_name, last_name )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rows = (data ?? []).map((r: any) => {
      const full =
        r?.employees?.first_name || r?.employees?.last_name
          ? `${r?.employees?.first_name ?? ""} ${r?.employees?.last_name ?? ""}`.trim()
          : "—";

      return {
        id: r.id as string,
        employeeId: (r.employee_id ?? null) as string | null,
        employeeName: full,
        contractType: r.type ?? null,
        position: r.position ?? null,
        department: r.department ?? null,
        startDate: r.start_date ?? null,
        endDate: r.end_date ?? null,
        salary: typeof r.salary === "number" ? r.salary : r.salary ? Number(r.salary) : null,
        status: r.status ?? null,
        renewalDate: r.renewal_date ?? null,
        createdDate: r.created_at ?? null,
        lastModified: r.updated_at ?? r.created_at ?? null,
      };
    });

    return NextResponse.json({ rows });
  } catch (e: any) {
    const message =
      e?.message?.includes("relation") || e?.message?.includes("does not exist")
        ? "La tabla 'contracts' aún no existe o el JOIN a 'employees' no coincide con tu esquema. El UI seguirá cargando sin datos."
        : e?.message || "Error desconocido";
    return NextResponse.json({ rows: [], note: message });
  }
}
