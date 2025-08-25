import React from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 24 },
  h1: { fontSize: 16, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { fontSize: 11, color: "#555" },
  val: { fontSize: 12, fontWeight: 700 },
  box: { border: 1, borderColor: "#e5e7eb", padding: 12, marginTop: 10, borderRadius: 4 }
});

export async function buildPayrollPdf({ header, item }: { header: any; item: any; }) {
  const Doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Clientum — Recibo de Nómina</Text>

        <View style={styles.box}>
          <View style={styles.row}>
            <Text style={styles.label}>Periodo</Text>
            <Text style={styles.val}>{header.period_month}/{header.period_year}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Empleado</Text>
            <Text style={styles.val}>{item.employees?.full_name ?? item.employee_id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Concepto</Text>
            <Text style={styles.val}>{item.concept}</Text>
          </View>
        </View>

        <View style={styles.box}>
          <View style={styles.row}><Text>Bruto base</Text><Text>{Number(item.base_gross).toFixed(2)} €</Text></View>
          <View style={styles.row}><Text>IRPF</Text><Text>{Number(item.irpf_amount).toFixed(2)} €</Text></View>
          <View style={styles.row}><Text>SS Trab.</Text><Text>{Number(item.ss_emp_amount).toFixed(2)} €</Text></View>
          <View style={styles.row}><Text>SS Empresa</Text><Text>{Number(item.ss_er_amount).toFixed(2)} €</Text></View>
          <View style={styles.row}><Text style={{ fontWeight: 700 }}>Neto</Text><Text style={{ fontWeight: 700 }}>{Number(item.net).toFixed(2)} €</Text></View>
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 10, color: "#777" }}>
            Estado: {header.status}  •  Generado: {new Date(header.processed_at ?? header.created_at).toLocaleString()}
          </Text>
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(Doc).toBlob();
  const buff = await blob.arrayBuffer();
  return new Uint8Array(buff);
}
