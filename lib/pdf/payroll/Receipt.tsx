import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export type ReceiptData = {
  company: { name: string; cif: string; address?: string; ccc?: string };
  employee: { name: string; nif?: string; ssn?: string; job_title?: string; iban?: string };
  period: { year: number; month: number; days?: number | null };
  items: Array<{ concept: string; amount: number; type: "earning" | "deduction" }>;
  bases: { cotizacion: number; irpf: number };
  contribEmployee: { ss: number; pctSS: number; irpf: number; pctIRPF: number; total: number };
  contribEmployer: { ss: number; pctSS: number };
  totals: { devengos: number; deducciones: number; neto: number };
};

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 10 },
  h1: { fontSize: 14, fontWeight: 700 },
  h2: { fontSize: 11, fontWeight: 700, marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  box: { border: 1, borderColor: "#ddd", borderRadius: 4, padding: 8, marginBottom: 8 },
  table: { borderRadius: 4, border: 1, borderColor: "#ddd", marginTop: 6 },
  tr: { flexDirection: "row" },
  th: { flex: 1, padding: 6, backgroundColor: "#f4f6f8", borderRight: 1, borderColor: "#ddd", fontWeight: 700 },
  td: { flex: 1, padding: 6, borderTop: 1, borderRight: 1, borderColor: "#eee" },
  tdRight: { textAlign: "right" },
  signature: { marginTop: 18, flexDirection: "row", justifyContent: "space-between" },
  small: { fontSize: 9, color: "#555" },
});

export default function ReceiptPDF(d: ReceiptData) {
  const month = String(d.period.month).padStart(2, "0");

  const earnings = d.items.filter((i) => i.type === "earning");
  const deductions = d.items.filter((i) => i.type === "deduction");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.h1}>Recibo de Salarios · {month}/{d.period.year}</Text>
          <Text style={styles.small}>
            De acuerdo con el art. 29 del ET y la Orden ESS/2098/2014 (o normativa vigente).
          </Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.box, { flex: 1 }]}>
            <Text style={styles.h2}>Empresa</Text>
            <Text>Nombre: {d.company.name}</Text>
            <Text>CIF/NIF: {d.company.cif}</Text>
            <Text>CCC: {d.company.ccc ?? "—"}</Text>
            <Text>Dirección: {d.company.address ?? "—"}</Text>
          </View>
          <View style={[styles.box, { flex: 1 }]}>
            <Text style={styles.h2}>Trabajador/a</Text>
            <Text>Nombre: {d.employee.name}</Text>
            <Text>NIF/NIE: {d.employee.nif ?? "—"}</Text>
            <Text>Nº SS: {d.employee.ssn ?? "—"}</Text>
            <Text>Puesto: {d.employee.job_title ?? "—"}</Text>
            <Text>IBAN: {d.employee.iban ?? "—"}</Text>
          </View>
        </View>

        <View style={styles.box}>
          <Text>Periodo: {month}/{d.period.year} · Días cotizados: {d.period.days ?? "—"}</Text>
          <Text>Bases: Cotización {toEur(d.bases.cotizacion)} · IRPF {toEur(d.bases.irpf)}</Text>
        </View>

        {/* Devengos */}
        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={[styles.th, { flex: 3 }]}>Devengos</Text>
            <Text style={[styles.th, styles.tdRight]}>Importe</Text>
          </View>
          {earnings.length === 0 ? (
            <View style={styles.tr}>
              <Text style={[styles.td, { flex: 3 }]}>—</Text>
              <Text style={[styles.td, styles.tdRight]}>—</Text>
            </View>
          ) : (
            earnings.map((e, i) => (
              <View style={styles.tr} key={`e-${i}`}>
                <Text style={[styles.td, { flex: 3 }]}>{e.concept}</Text>
                <Text style={[styles.td, styles.tdRight]}>{toEur(e.amount)}</Text>
              </View>
            ))
          )}
          <View style={styles.tr}>
            <Text style={[styles.td, { flex: 3, fontWeight: 700 }]}>Total devengos</Text>
            <Text style={[styles.td, styles.tdRight, { fontWeight: 700 }]}>{toEur(d.totals.devengos)}</Text>
          </View>
        </View>

        {/* Deducciones */}
        <View style={[styles.table, { marginTop: 10 }]}>
          <View style={styles.tr}>
            <Text style={[styles.th, { flex: 3 }]}>Deducciones</Text>
            <Text style={[styles.th, styles.tdRight]}>Importe</Text>
          </View>
          {/* SS + IRPF automáticos */}
          <View style={styles.tr}>
            <Text style={[styles.td, { flex: 3 }]}>
              Seguridad Social Trabajador ({pct(d.contribEmployee.pctSS)})
            </Text>
            <Text style={[styles.td, styles.tdRight]}>{toEur(d.contribEmployee.ss)}</Text>
          </View>
          <View style={styles.tr}>
            <Text style={[styles.td, { flex: 3 }]}>IRPF ({pct(d.contribEmployee.pctIRPF)})</Text>
            <Text style={[styles.td, styles.tdRight]}>{toEur(d.contribEmployee.irpf)}</Text>
          </View>
          {/* Manuales */}
          {deductions.map((e, i) => (
            <View style={styles.tr} key={`d-${i}`}>
              <Text style={[styles.td, { flex: 3 }]}>{e.concept}</Text>
              <Text style={[styles.td, styles.tdRight]}>{toEur(e.amount)}</Text>
            </View>
          ))}
          <View style={styles.tr}>
            <Text style={[styles.td, { flex: 3, fontWeight: 700 }]}>Total deducciones</Text>
            <Text style={[styles.td, styles.tdRight, { fontWeight: 700 }]}>{toEur(d.totals.deducciones)}</Text>
          </View>
        </View>

        {/* Resumen Neto y costes empresa */}
        <View style={[styles.box, { marginTop: 10 }]}>
          <Text style={styles.h2}>Resumen</Text>
          <Text>Devengos: {toEur(d.totals.devengos)} · Deducciones: {toEur(d.totals.deducciones)}</Text>
          <Text style={{ fontSize: 12, fontWeight: 700 }}>Neto a percibir: {toEur(d.totals.neto)}</Text>
          <Text style={{ marginTop: 6 }}>
            Aportación empresa (SS empresa {pct(d.contribEmployer.pctSS)}): {toEur(d.contribEmployer.ss)} — (informativo)
          </Text>
        </View>

        {/* Firmas */}
        <View style={styles.signature}>
          <View>
            <Text>Recibí: el/la trabajador/a</Text>
            <Text style={{ marginTop: 40 }}>Firma: ___________________________</Text>
          </View>
          <View>
            <Text>La empresa</Text>
            <Text style={{ marginTop: 40 }}>Firma y sello: ____________________</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

function toEur(n: number) {
  return (n ?? 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}
function pct(n: number) {
  return `${(n ?? 0).toFixed(2)}%`;
}
