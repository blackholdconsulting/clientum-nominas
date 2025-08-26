// app/api/payroll/generate/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const y = Number(searchParams.get("year")) || new Date().getFullYear();
  const m = Number(searchParams.get("month")) || new Date().getMonth() + 1;

  // Redirección SIEMPRE relativa al host de la petición
  return NextResponse.redirect(new URL(`/payroll/period/${y}/${m}`, req.url), 307);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const y = Number(body?.year) || new Date().getFullYear();
  const m = Number(body?.month) || new Date().getMonth() + 1;

  return NextResponse.redirect(new URL(`/payroll/period/${y}/${m}`, req.url), 303);
}
