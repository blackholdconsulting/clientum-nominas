"use server";
export const runtime = "nodejs"; // pdf-lib necesita Node, no Edge

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { PDFDocument, StandardFonts } from "pdf-lib";

function createSb() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

/** Crea las líneas que falten para los empleados sin item en esta nómina */
export async function ensureItemsForEmployees(payrollId: number) {
  const sb = createSb();

  // Nómina
  const { data: pay } = await sb
    .from("payrolls")
    .select("id, period_year, period_month")
    .eq("id", payrollId)
    .single();

  // Empleados
  const { data: employees } = await sb.from("employees").select("id");

  // Items existentes
  const { data: exist } = await sb
    .from("payroll_items")
    .select("employee_id")
    .eq("payroll_id", payrollId);

  const existing = new Set((exist ?? []).map((r) => r.employee_id));
  const toCreate =
    (employees ?? []).filter((e) => !existing.has(e.id)).map((e) => ({
      payroll_id: payrollId,
      employee_id: e.id,
      base_gross: 0,
      irpf_amount: 0,
      ss_emp_amount: 0,
      ss_er_amount: 0,
      net: 0,
    })) ?? [];

  if (toCreate.length) {
    const { error } = await sb.from("payroll_items").insert(toCreate);
    if (error) throw new Error(error.message);
  }

  return { ok: true };
}

/** Upsert de una línea */
export async function upsertItem(row: {
  id?: number;
  payroll_id: number;
  employee_id: number;
  base_gross: number;
  irpf_amount: number;
  ss_emp_amount: number;
  ss_er_amount: number;
  net: number;
}) {
  const sb = createSb();
  const { data, error } = await sb
    .from("payroll_items")
    .upsert(row, { onConflict: "id" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Genera PDF de una línea y lo sube a Storage, devolviendo la URL pública */
export async function generateItemPdf(itemId: number) {
  const sb = createSb();

  // Trae item + empleado + periodo
  const { data: item, error: ei } = await sb
    .from("payroll_items")
    .select(
      `
      id, payroll_id, employee_id, base_gross, irpf_amount, ss_emp_amount, ss_er_amount, net,
      employee:employees(id, full_name),
      payroll:payrolls(id, period_year, period_month)
    `
    )
    .eq("id", itemId)
    .single();
  if (ei) throw new Error(ei.message);

  // --- PDF simple (ajusta a tu diseño) ---
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = 800;
  const draw = (txt: string, size = 12) => {
    page.drawText(txt, { x: 50, y, size, font });
    y -= size + 8;
  };

  draw(`Nómina ${item.payroll.period_month}/${item.payroll.period_year}`, 16);
  draw(`Empleado: ${item.employee.full_name}`);
  draw(`Bruto: ${item.base_gross.toFixed(2)} €`);
  draw(`IRPF: ${item.irpf_amount.toFixed(2)} €`);
  draw(`SS Empleado: ${item.ss_emp_amount.toFixed(2)} €`);
  draw(`SS Empresa: ${item.ss_er_amount.toFixed(2)} €`);
  draw(`Neto: ${item.net.toFixed(2)} €`, 14);

  const bytes = await pdfDoc.save();

  // Subir archivo
  const filePath = `${item.employee_id}/${item.payroll.period_year}-${String(
    item.payroll.period_month
  ).padStart(2, "0")}/nomina-${item.id}.pdf`;

  // upsert en bucket 'nominas'
  const { error: upErr } = await sb.storage
    .from("nominas")
    .upload(filePath, Buffer.from(bytes), {
      contentType: "application/pdf",
      upsert: true,
    });

  if (upErr) throw new Error(upErr.message);

  // URL pública
  const { data: pub } = sb.storage.from("nominas").getPublicUrl(filePath);
  const url = pub.publicUrl;

  // Guarda URL en la línea
  await sb.from("payroll_items").update({ pdf_url: url }).eq("id", itemId);

  return { ok: true, url };
}
