// lib/pdf/payroll/Receipt.tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Tipado de entrada
export type ReceiptInput = {
  company: {
    name: string;
    cif?: string;
    ccc?: string;
    address?: string;
  };
  employee: {
    name: string;
    email?: string;
    position?: string;
    nif?: string;
    ssn?: string;
    group?: string;
  };
  period: { year: number; month: number; label: string };
  payroll: {
    status?: string | null;
    daysInPeriod?: number | null;
  };
  totals: {
    devengos: number;
    deducciones: number;
    liquido: number;
    base_cc: number;
    base_irpf: number;
    irpf_pct: number;
    ss_emp_pct: number;
  };
  lines: Array<{
    code?: string;
    label: string;
    units?: number;
    amount: number;
    category?: "salarial" | "no_salarial" | "deduccion";
  }>;
};

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10 },
  h1: { fontSize: 14, fontWeight: 700, marginBottom: 6 },
  h2: { fontSize: 12, fontWeight: 700, marginVertical: 6 },
  row: { flexDirection: "row" },
  col: { flexDirection: "column" },
  card: { border: 1, borderColor: "#ddd", padding: 8, borderRadius: 4 },
  mt8: { marginTop: 8 },
  ml8: { marginLeft: 8 },
  table: { width: "100%", border: 1, borderColor: "#ddd", marginTop: 6 },
  tr: { flexDirection: "row" },
  th: {
    flex: 1,
    fontWeight: 700,
    padding: 6,
    borderRight: 1,
    borderBottom: 1,
    borderColor: "#ddd",
  },
  td: {
    flex: 1,
    padding: 6,
    borderRight: 1,
    borderBottom: 1,
    borderColor: "#eee",
  },
  right: { textAlign: "right" },
  small: { fontSize: 9, color: "#666" },
  badge: {
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#eef2ff",
    color: "#312e81",
    alignSelf: "flex-start",
  },
});

function money(n: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n || 0);
}

export default function ReceiptPDF(props: ReceiptInput) {
  const { company, employee, period, payroll, totals, lines } = props;

  // Cadenas precompuestas (evitan pasar objetos/elementos como hijos de <Text>)
  const pStatus = payroll.status ? String(payroll.status) : null;
  const pDays =
    typeof payroll.daysInPeriod === "number"
      ? String(payroll.daysInPeriod)
      : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabecera */}
        <View style={[styles.row, { justifyContent: "space-between" }]}>
          <View style={styles.col}>
            <Text style={styles.h1}>{String(company.name)}</Text>
            {company.cif ? (
              <Text style={styles.small}>CIF: {String(company.cif)}</Text>
            ) : null}
            {company.ccc ? (
              <Text style={styles.small}>CCC: {String(company.ccc)}</Text>
            ) : null}
            {company.address ? (
              <Text style={styles.small}>{String(company.address)}</Text>
            ) : null}
          </View>

          <View style={styles.col}>
            <Text style={styles.badge}>
              Recibo de salarios — {String(period.label)}
            </Text>
            {pStatus ? (
              <Text style={styles.small}>Estado: {pStatus}</Text>
            ) : null}
          </View>
        </View>

        {/* Bloques empresa/empleado */}
        <View style={[styles.row, styles.mt8]}>
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.h2}>Trabajador/a</Text>
            <Text>{String(employee.name)}</Text>
            {employee.position ? (
              <Text style={styles.small}>{String(employee.position)}</Text>
            ) : null}
            {employee.email ? (
              <Text style={styles.small}>{String(employee.email)}</Text>
            ) : null}
            {employee.nif ? (
              <Text style={styles.small}>NIF: {String(employee.nif)}</Text>
            ) : null}
            {employee.ssn ? (
              <Text style={styles.small}>Nº SS: {String(employee.ssn)}</Text>
            ) : null}
            {employee.group ? (
              <Text style={styles.small}>
                Grupo cotización: {String(employee.group)}
              </Text>
            ) : null}
          </View>

          <View style={[styles.card, styles.ml8, { flex: 1 }]}>
            <Text style={styles.h2}>Bases y tipos</Text>
            <Text>Base CC: {money(Number(totals.base_cc))}</Text>
            <Text>Base IRPF: {money(Number(totals.base_irpf))}</Text>
            <Text>IRPF: {Number(totals.irpf_pct).toFixed(2)}%</Text>
            <Text>SS trabajador: {Number(totals.ss_emp_pct).toFixed(2)}%</Text>
            {pDays ? <Text>Días cotizados: {pDays}</Text> : null}
          </View>
        </View>

        {/* Tabla de líneas */}
        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={styles.th}>Concepto</Text>
            <Text style={[styles.th, styles.right]}>Unid.</Text>
            <Text style={[styles.th, styles.right]}>Importe</Text>
          </View>

          {lines.map((l, i) => {
            const label =
              l.code && l.code.length > 0
                ? `${l.label} (${l.code})`
                : l.label;
            const unitsText =
              typeof l.units === "number" ? l.units.toFixed(2) : "—";
            const amountText = money(Number(l.amount));

            return (
              <View key={String(i)} style={styles.tr}>
                <Text style={styles.td}>{String(label)}</Text>
                <Text style={[styles.td, styles.right]}>{unitsText}</Text>
                <Text style={[styles.td, styles.right]}>{amountText}</Text>
              </View>
            );
          })}
        </View>

        {/* Totales */}
        <View style={[styles.row, styles.mt8]}>
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.h2}>Totales</Text>

            <View style={styles.row}>
              <Text style={{ flex: 1 }}>Devengos</Text>
              <Text style={[styles.right, { flex: 1 }]}>
                {money(Number(totals.devengos))}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={{ flex: 1 }}>Deducciones</Text>
              <Text style={[styles.right, { flex: 1 }]}>
                {money(Number(totals.deducciones))}
              </Text>
            </View>

            <View style={[styles.row, { marginTop: 6 }]}>
              <Text style={{ flex: 1, fontWeight: 700 }}>
                Líquido a percibir
              </Text>
              <Text style={[styles.right, { flex: 1, fontWeight: 700 }]}>
                {money(Number(totals.liquido))}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={styles.small}>
            Este recibo se expide conforme al Estatuto de los Trabajadores y
            normativa de Seguridad Social vigente.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
