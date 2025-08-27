export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import React from "react";
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 12 },
  h1: { fontSize: 16, fontWeight: 700, marginBottom: 10 },
  card: { border: 1, borderColor: "#ddd", padding: 10, borderRadius: 4, marginTop: 8 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { color: "#555" },
  value: { fontWeight: 700 },
});

function eur(n: any) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(num);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const year = Number(body?.year || new Date().getFullYear());
    const month = Number(body?.month || new Date().getMonth() + 1);
    const employeeName: string = body?.employeeName || "Empleado";
    const status: string = body?.status || "borrador";
    const liquido: number = Number(body?.liquido ?? 1200);

    const doc = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: "A4", style: styles.page },
        React.createElement(Text, { style: styles.h1 }, `Recibo de salarios — ${String(month).padStart(2, "0")}/${year}`),
        React.createElement(
          View,
          { style: styles.card },
          React.createElement(
            View,
            { style: styles.row },
            React.createElement(Text, { style: styles.label }, "Empleado:"),
            React.createElement(Text, { style: styles.value }, String(employeeName))
          ),
          React.createElement(
            View,
            { style: styles.row },
            React.createElement(Text, { style: styles.label }, "Estado:"),
            React.createElement(Text, { style: styles.value }, String(status))
          ),
          React.createElement(
            View,
            { style: styles.row },
            React.createElement(Text, { style: styles.label }, "Líquido a percibir:"),
            React.createElement(Text, { style: styles.value }, eur(liquido))
          ),
        ),
        React.createElement(
          View,
          { style: styles.card },
          React.createElement(Text, null, "PDF mínimo para validar generación desde el servidor.")
        )
      )
    );

    const buffer = await pdf(doc).toBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="recibo_${year}_${String(month).padStart(2, "0")}.pdf"`,
      },
    });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e?.message ?? "Error generando PDF" }, { status: 500 });
  }
}
