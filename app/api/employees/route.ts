// app/api/employees/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

type Body = {
  // Personal
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dni?: string;
  birthDate?: string;      // "YYYY-MM-DD"
  address?: string;
  city?: string;
  postalCode?: string;

  // Employment
  position?: string;       // = job_title
  department?: string;     // nombre del departamento (no ID)
  startDate?: string;      // "YYYY-MM-DD"
  contractType?: string;
  workingHours?: string;   // número en string
  salary?: string;         // número en string

  // Additional
  bankAccount?: string;    // IBAN
  socialSecurityNumber?: string; // SSN
  notes?: string;
};

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServerClient();
    const user = await requireUser(); // asegura sesión

    const body = (await req.json()) as Body;

    // Validación mínima
    if (!body?.firstName || !body?.lastName || !body?.email || !body?.dni) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    // Resolver/crear departamento por nombre (si viene)
    let departmentId: string | null = null;
    if (body.department && body.department.trim() !== "") {
      const name = body.department.trim();
      const slug = slugify(name);

      // intentamos encontrarlo por nombre (case-insensitive) o slug
      const { data: found } = await supabase
        .from("departments")
        .select("id,name")
        .ilike("name", name)
        .maybeSingle();

      if (found?.id) {
        departmentId = found.id;
      } else {
        const { data: created, error: depErr } = await supabase
          .from("departments")
          .insert({ name, slug })
          .select("id")
          .single();
        if (depErr) throw depErr;
        departmentId = created.id;
      }
    }

    // Mapeo a columnas de DB
    const weekly_hours =
      body.workingHours && body.workingHours.trim() !== ""
        ? Number(body.workingHours)
        : null;

    const annual_salary_eur =
      body.salary && body.salary.trim() !== ""
        ? Number(String(body.salary).replace(",", "."))
        : null;

    const payload = {
      user_id: user.id, // RLS/trigger también lo cubrirá
      first_name: body.firstName,
      last_name: body.lastName,
      full_name: `${body.firstName} ${body.lastName}`.trim(),
      email: body.email,
      phone: body.phone || null,
      national_id: body.dni || null,
      birth_date: body.birthDate || null,
      address_line: body.address || null,
      city: body.city || null,
      postal_code: body.postalCode || null,

      job_title: body.position || null,
      position: body.position || null, // compat con listados
      contract_type: body.contractType || null,
      start_date: body.startDate || null,
      weekly_hours,
      annual_salary_eur,
      department_id: departmentId,

      iban: body.bankAccount || null,
      ssn: body.socialSecurityNumber || null,
      notes: body.notes || null,
    };

    const { error } = await supabase.from("employees").insert(payload);
    if (error) throw error;

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/employees] error:", e?.message || e);
    return NextResponse.json(
      { error: e?.message || "Error al crear empleado" },
      { status: 500 }
    );
  }
}
