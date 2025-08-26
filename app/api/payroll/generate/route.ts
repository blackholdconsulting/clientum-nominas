// app/api/payroll/generate/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Si alguien visita GET /api/payroll/generate (o un botón viejo apunta aquí),
 * redirigimos al editor del periodo actual o al que venga por query (?year=&month=).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let year = Number(searchParams.get("year"));
  let month = Number(searchParams.get("month"));

  const now = new Date();
  if (!year || isNaN(year)) year = now.getFullYear();
  if (!month || isNaN(month)) month = now.getMonth() + 1;

  const url = new URL(`/payroll/period/${year}/${month}`, req.url);
  return NextResponse.redirect(url, 307);
}

/**
 * Si tenías POST aquí para “crear nómina”, puedes mantenerlo;
 * tras crear, redirige al editor igualmente.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    let year = Number(body?.year);
    let month = Number(body?.month);

    const now = new Date();
    if (!year || isNaN(year)) year = now.getFullYear();
    if (!month || isNaN(month)) month = now.getMonth() + 1;

    // (Opcional) aquí podrías seguir creando el borrador si lo necesitabas
    // await createDraftPayroll({ year, month, ... });

    const url = new URL(`/payroll/period/${year}/${month}`, req.url);
    return NextResponse.redirect(url, 303);
  } catch (e) {
    // como última línea de defensa, redirige al editor del mes actual
    const now = new Date();
    const url = new URL(`/payroll/period/${now.getFullYear()}/${now.getMonth() + 1}`, req.url);
    return NextResponse.redirect(url, 307);
  }
}
