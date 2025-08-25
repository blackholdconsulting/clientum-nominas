import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { Document, Page, Text, View, StyleSheet, Font, pdf } from "@react-pdf/renderer";

Font.register({ family: "Inter", fonts: [
  { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMaHQ.ttf" }
]});

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: "Inter" },
  h1: { fontSize: 14, marginBottom: 12, fontWeight: 700 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  box: { border: 1, padding: 8, borderRadius: 4, marginBottom: 8 },
  table: { border: 1, borderRadius: 4, marginTop: 8 },
  trow: { flexDirection: "row", borderBottom: 1 },
  th: { flex: 1, padding: 6, backgroundColor: "#f3f4f6", fontWeight: 700, borderRight: 1 },
  td: { flex: 1, padding: 6, borderRight: 1 },
  right: { textAlign: "right" },
});

function eur(n?: number) { return (n??0).toFixed(2).replace(".", ",") + " €"; }

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await requireUser();
  const supabase = getSupabaseServerClient();

  const { data: p, error } = await supabase
    .from("payrolls")
    .select("*, employees:employee_id(full_name, national_id, email)")
    .eq("id", params.id)
    .maybeSingle();
  if (error || !p) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: lines } = await supabase
    .from("payroll_lines")
    .select("*")
    .eq("payroll_id", params.id)
    .order("order_ix", { ascending: true });

  const Devengo = (lines ?? []).filter(l=>l.typ==="earning");
  const Deducc = (lines ?? []).filter(l=>l.typ==="deduction");

  const Doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Recibo de Salarios · {p.period_month}/{p.period_year}</Text>

        <View style={styles.box}>
          <View style={styles.row}>
            <Text>Empresa: Clientum</Text>
            <Text>Fecha: {new Date(p.created_at).toLocaleDateString()}</Text>
          </View>
          <View style={styles.row}>
            <Text>Trabajador: {p.employees?.full_name}</Text>
            <Text>NIF/NIE: {p.employees?.national_id || "-"}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.trow}>
            <Text style={styles.th}>Código</Text>
            <Text style={styles.th}>Concepto</Text>
            <Text style={[styles.th, styles.right]}>Importe</Text>
          </View>
          {Devengo.map((l:any, i:number)=>(
            <View style={styles.trow} key={"e"+i}>
              <Text style={styles.td}>{l.concept_code}</Text>
              <Text style={styles.td}>{l.concept_name}</Text>
              <Text style={[styles.td, styles.right]}>{eur(l.amount)}</Text>
            </View>
          ))}
        </View>

        {!!Deducc.length && (
          <>
            <View style={{ height: 8 }} />
            <View style={styles.table}>
              <View style={styles.trow}>
                <Text style={styles.th}>Deducción</Text>
                <Text style={[styles.th, styles.right]}>Importe</Text>
              </View>
              {Deducc.map((l:any, i:number)=>(
                <View style={styles.trow} key={"d"+i}>
                  <Text style={styles.td}>{l.concept_name}</Text>
                  <Text style={[styles.td, styles.right]}>{eur(Math.abs(l.amount))}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.box}>
          <View style={styles.row}><Text>Base CC</Text><Text>{eur(p.base_cc)}</Text></View>
          <View style={styles.row}><Text>Base IRPF</Text><Text>{eur(p.base_irpf)}</Text></View>
          <View style={styles.row}><Text>IRPF {p.irpf_pct?.toFixed(2)}%</Text><Text>{eur((p.base_irpf*p.irpf_pct)/100)}</Text></View>
          <View style={styles.row}><Text>Cuota Trabajador S.S.</Text><Text>{eur(p.ss_employee)}</Text></View>
          <View style={[styles.row, { marginTop: 6 }]}><Text style={{fontWeight:700}}>Líquido a Percibir</Text><Text style={{fontWeight:700}}>{eur(p.net_total)}</Text></View>
        </View>

        <Text style={{ marginTop: 12, fontSize: 9, color: "#6b7280" }}>
          Documento generado automáticamente por Clientum Nóminas.
        </Text>
      </Page>
    </Document>
  );

  const file = await pdf(Doc).toBuffer();
  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="nomina_${p.period_year}_${p.period_month}.pdf"`,
    },
  });
}
