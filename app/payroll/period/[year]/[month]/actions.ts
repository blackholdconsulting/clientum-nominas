'use server';

import { PDFDocument, StandardFonts } from 'pdf-lib';
import { createServerClient } from '@/utils/supabase/server'; // tu helper actual
import { revalidatePath } from 'next/cache';

function pad2(n: number) { return n.toString().padStart(2, '0'); }

export async function generatePayrollPdfAndStore(opts: {
  payrollId: string;
  employeeId: string;
  userId: string;        // owner (empresa)
  year: number;
  month: number;
}) {
  const { payrollId, employeeId, userId, year, month } = opts;
  const supabase = await createServerClient();

  // 1) Trae los datos del item para pintar la nómina
  const { data: item, error: eItem } = await supabase
    .from('payroll_items')
    .select(`
      employee_id,
      user_id,
      base_gross, irpf_amount, ss_emp_amount, ss_er_amount, net
    `)
    .eq('payroll_id', payrollId)
    .eq('employee_id', employeeId)
    .single();

  if (eItem || !item) throw new Error(`No payroll item: ${eItem?.message}`);

  // 2) Crea un PDF básico (puedes cambiarlo luego al formato oficial)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const draw = (text: string, y: number) =>
    page.drawText(text, { x: 50, y, size: 12, font });

  let y = 800;
  draw('NÓMINA (borrador)', y); y -= 30;
  draw(`Periodo: ${year}-${pad2(month)}`, y); y -= 20;
  draw(`Empleado: ${employeeId}`, y); y -= 20;
  draw(`Bruto base: ${item.base_gross?.toFixed?.(2) ?? item.base_gross} €`, y); y -= 20;
  draw(`IRPF: ${item.irpf_amount?.toFixed?.(2) ?? item.irpf_amount} €`, y); y -= 20;
  draw(`SS Trabajador: ${item.ss_emp_amount?.toFixed?.(2) ?? item.ss_emp_amount} €`, y); y -= 20;
  draw(`SS Empresa: ${item.ss_er_amount?.toFixed?.(2) ?? item.ss_er_amount} €`, y); y -= 20;
  draw(`Neto: ${item.net?.toFixed?.(2) ?? item.net} €`, y); y -= 20;

  const pdfBytes = await pdfDoc.save();

  // 3) Sube al bucket 'nominas'
  const path = `${userId}/${year}-${pad2(month)}/nomina-${payrollId}-${employeeId}.pdf`;

  // Nota: si usas Next 15, Buffer desde node: 'buffer' (no Edge runtime)
  const { error: upErr } = await supabase.storage
    .from('nominas')
    .upload(path, new Blob([pdfBytes]), { upsert: true, contentType: 'application/pdf' });

  if (upErr) throw new Error(`Upload PDF error: ${upErr.message}`);

  // 4) Construye URL firmable (o pública si decides firmar bajo demanda)
  const { data: signed } = await supabase.storage
    .from('nominas')
    .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 días

  const pdfUrl = signed?.signedUrl ?? null;

  // 5) Guarda url en payroll_items
  const { error: updErr } = await supabase
    .from('payroll_items')
    .update({ pdf_url: pdfUrl })
    .eq('payroll_id', payrollId)
    .eq('employee_id', employeeId);

  if (updErr) throw new Error(`Update item pdf_url error: ${updErr.message}`);

  revalidatePath(`/payroll/period/${year}/${month}`);
  return { ok: true, pdfUrl };
}
