export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Helpers -------------------------------------------------
function eur(n: any) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(num);
}

function monthLabel(y: number, m: number) {
  const d = new Date(y, Math.max(0, (m || 1) - 1), 1);
  return d.toLocaleDateString("es-ES", { year: "numeric", month: "long" });
}

async function buildPdf(params: {
  year: number;
  month: number;
  employeeName: string;
  status: string;
  devengos: number;
  deducciones: number;
  liquido: number;
}) {
  const { year, month, employeeName, status, devengos, deducciones, liquido } = params;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 (pt)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const L = 60;
  let y = 780;

  // Título
  page.drawText(`Recibo de salarios — ${monthLabel(year, month)}`, {
    x: L,
    y,
    size: 18,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });

  const line = (label: string, value: string) => {
    y -= 18;
    page.drawText(label, { x: L, y, size: 11, font, color: rgb(0.35, 0.35, 0.35) });
    page.drawText(value, { x: L + 160, y, size: 11, font: bold, color: rgb(0, 0, 0) });
  };

  // Cabecera
  y -= 28;
  line("Empleado:", String(employeeName || "Empleado"));
  line("Estado:", String(status || "borrador"));
  line("Periodo:", `${String(month).padStart(2, "0")}/${year}`);

  // Separador
  y -= 18;
  page.drawLine({
    start: { x: L, y },
    end: { x: 535, y },
    thickness: 0.8,
    color: rgb(0.85, 0.85, 0.85),
  });

  // Totales
  y -= 20;
  page.drawText("Totales", { x: L, y, size: 13, font: bold });
  const row = (k: string, v: string) => {
    y -= 18;
    page.drawText(k, { x: L, y, size: 11, font, color: rgb(0.35, 0.35, 0.35) });
    page.drawText(v, { x: 535 - 160, y, size: 11, font: bold, color: rgb(0, 0, 0) });
  };
  row("Devengos:", eur(devengos));
  row("Deducciones:", eur(deducciones));
  row("Líquido a percibir:", eur(liquido));

  // Nota legal breve
  y -= 28;
  page.drawText(
    "Este recibo se expide conforme al Estatuto de los Trabajadores y normativa vigente de Seguridad Social.",
    { x: L, y, size: 9, font, color: rgb(0.35, 0.35, 0.35), maxWidth: 475 }
  );

  const bytes = await pdfDoc.save();
  return new Uint8Array(bytes);
}

function okPdf(bytes: Uint8Array, year: number, month: number) {
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recibo_${year}_${String(month).padStart(2, "0")}.pdf"`,
    },
  });
}

// GET: abrir con link (querystring)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const year = Number(url.searchParams.get("year") || new Date().getFullYear());
    const month = Number(url.searchParams.get("month") || new Date().getMonth() + 1);
    const employeeName = url.searchParams.get("employeeName") || "Empleado";
    const status = url.searchParams.get("status") || "borrador";
    const devengos = Number(url.searchParams.get("devengos") || 1500);
    const deducciones = Number(url.searchParams.get("deducciones") || 300);
    const liquido = Number(url.searchParams.get("liquido") || 1200);

    const bytes = await buildPdf({ year, month, employeeName, status, devengos, deducciones, liquido });
    return okPdf(bytes, year, month);
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e?.message ?? "Error generando PDF" }, { status: 500 });
  }
}

// POST: por si en el futuro lo vuelves a usar vía fetch
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const year = Number(body?.year || new Date().getFullYear());
    const month = Number(body?.month || new Date().getMonth() + 1);
    const employeeName = body?.employeeName || "Empleado";
    const status = body?.status || "borrador";
    const devengos = Number(body?.devengos ?? 1500);
    const deducciones = Number(body?.deducciones ?? 300);
    const liquido = Number(body?.liquido ?? 1200);

    const bytes = await buildPdf({ year, month, employeeName, status, devengos, deducciones, liquido });
    return okPdf(bytes, year, month);
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e?.message ?? "Error generando PDF" }, { status: 500 });
  }
}
