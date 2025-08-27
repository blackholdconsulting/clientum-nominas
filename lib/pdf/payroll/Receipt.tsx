import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export type ReceiptInput = {
  company: { name: string; cif?: string; ccc?: string; address?: string };
  employee: {
    name: string; email?: string; position?: string; nif?: string; ssn?: string; group?: string;
  };
  period: { year: number; month: number; label: string };
  payroll: { status?: string | null; daysInPeriod?: number | null };
  totals: {
    devengos: number; deducciones: number; liquido: number;
    base_cc: number; base_irpf: number; irpf_pct: number; ss_emp_pct: number;
  };
  lines: Array<{ code?: string; label: string; units?: number; amount: number; category?: "salarial" | "no_salarial" | "deduccion" }>;
};

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10 },
  h1: { fontSize: 14, fontWeight: 700, marginBottom: 6 },
  h2: { fontSize: 12, fontWeight: 700, marginVertical: 6 },
  row: { flexDirection: "row" },
  col: { flexDirection: "column" },
  card: { border: 1, borderColor: "#ddd", padding: 8, borderRadius: 4 },
  mt8: { marginTop: 8 }, ml8: { marginLeft: 8 },
  table: { width: "100%", border: 1, borderColor: "#ddd", marginTop: 6 },
  tr: { flexDirection: "row" },
  th: { flex: 1, fontWeight: 700, padding: 6, borderRight: 1, borderBottom: 1, borderColor: "#ddd" },
  td: { flex: 1, padding: 6, borderRight: 1, borderBottom: 1, borderColor: "#eee" },
  right: { textAlign: "right" },
  small: { fontSize: 9, color: "#666" },
  badge: { fontSize: 9, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "#eef2ff", color: "#312e81", alignSelf: "flex-start" },
});

function s(v: any) { return v == null ? "" : String(v); }
function money(n: any) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(num);
}

export default function ReceiptPDF(props: ReceiptInput) {
  const { company, employee, period, payroll, totals, lines } = props;
  const pStatus = payroll.status ? s(payroll.status) : null;
  const pDays = typeof payroll.daysInPeriod === "number" ? s(payroll.daysInPeriod) : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.row, { justifyContent: "space-between" }]}>
          <View style={styles.col}>
            <Text style={styles.h1}>{s(company.name)}</Text>
            {company.cif && <Text style={styles.small}>CIF: {s(company.cif)}</Text>}
            {company.ccc && <Text style={styles.small}>CCC: {s(company.ccc)}</Text>}
            {company.address && <Text style={styles.small}>{s(company.address)}</Text>}
          </View>
          <View style={styles.col}>
            <Text style={styles.badge}>Recibo de salarios — {s(period.label)}</Text>
            {pStatus && <Text style={styles.small}>Estado: {pStatus}</Text>}
          </View>
        </View>

        <View style={[styles.row, styles.mt8]}>
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.h2}>Trabajador/a</Text>
            <Text>{s(employee.name)}</Text>
            {employee.position && <Text style={styles.small}>{s(employee.position)}</Text>}
            {employee.email && <Text style={styles.small}>{s(employee.email)}</Text>}
            {employee.nif && <Text style={styles.small}>NIF: {s(employee.nif)}</Text>}
            {employee.ssn && <Text style={styles.small}>Nº SS: {s(employee.ssn)}</Text>}
            {employee.group && <Text style={styles.small}>Grupo cotización: {s(employee.group)}</Text>}
          </View>

          <View style={[styles.card, styles.ml8, { flex: 1 }]}>
            <Text style={styles.h2}>Bases y tipos</Text>
            <Text>Base CC: {money(totals.base_cc)}</Text>
            <Text>Base IRPF: {money(totals.base_irpf)}</Text>
            <Text>IRPF: {Number(totals.irpf_pct).toFixed(2)}%</Text>
            <Text>SS trabajador: {Number(totals.ss_emp_pct).toFixed(2)}%</Text>
            {pDays && <Text>Días cotizados: {pDays}</Text>}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={styles.th}>Concepto</Text>
            <Text style={[styles.th, styles.right]}>Unid.</Text>
            <Text style={[styles.th, styles.right]}>Importe</Text>
          </View>
          {lines.map((l, i) => {
            const label = l.code ? `${s(l.label)} (${s(l.code)})` : s(l.label);
            const unitsText = typeof l.units === "number" ? l.units.toFixed(2) : "—";
            const amountText = money(l.amount);
            return (
              <View key={String(i)} style={styles.tr}>
                <Text style={styles.td}>{label}</Text>
                <Text style={[styles.td, styles.right]}>{unitsText}</Text>
                <Text style={[styles.td, styles.right]}>{amountText}</Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.row, styles.mt8]}>
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.h2}>Totales</Text>
            <View style={styles.row}>
              <Text style={{ flex: 1 }}>Devengos</Text>
              <Text style={[styles.right, { flex: 1 }]}>{money(totals.devengos)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ flex: 1 }}>Deducciones</Text>
              <Text style={[styles.right, { flex: 1 }]}>{money(totals.deducciones)}</Text>
            </View>
            <View style={[styles.row, { marginTop: 6 }]}>
              <Text style={{ flex: 1, fontWeight: 700 }}>Líquido a percibir</Text>
              <Text style={[styles.right, { flex: 1, fontWeight: 700 }]}>{money(totals.liquido)}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={styles.small}>
            Este recibo se expide conforme al Estatuto de los Trabajadores y normativa de Seguridad Social vigente.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
