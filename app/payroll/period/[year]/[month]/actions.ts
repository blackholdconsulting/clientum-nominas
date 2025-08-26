'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServer } from '@/utils/supabase/server';

// ====== SCHEMAS ======
const ItemSchema = z.object({
  itemId: z.string().uuid().optional(),
  payrollId: z.string().uuid(),
  employeeId: z.string().uuid(),
  base_gross: z.coerce.number().min(0),
  irpf_amount: z.coerce.number().min(0),
  ss_emp_amount: z.coerce.number().min(0),
  ss_er_amount: z.coerce.number().min(0),
});

export async function upsertPayrollItemAction(formData: FormData) {
  const supabase = createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error('No autorizado');

  const parsed = ItemSchema.parse({
    itemId: formData.get('itemId') || undefined,
    payrollId: formData.get('payrollId'),
    employeeId: formData.get('employeeId'),
    base_gross: formData.get('base_gross'),
    irpf_amount: formData.get('irpf_amount'),
    ss_emp_amount: formData.get('ss_emp_amount'),
    ss_er_amount: formData.get('ss_er_amount'),
  });

  // neto simple = bruto - irpf - ss trabajador
  const net = parsed.base_gross - parsed.irpf_amount - parsed.ss_emp_amount;

  if (parsed.itemId) {
    const { error } = await supabase
      .from('payroll_items')
      .update({
        base_gross: parsed.base_gross,
        irpf_amount: parsed.irpf_amount,
        ss_emp_amount: parsed.ss_emp_amount,
        ss_er_amount: parsed.ss_er_amount,
        net,
      })
      .eq('id', parsed.itemId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('payroll_items').insert({
      payroll_id: parsed.payrollId,
      employee_id: parsed.employeeId,
      user_id: auth.user.id,
      base_gross: parsed.base_gross,
      irpf_amount: parsed.irpf_amount,
      ss_emp_amount: parsed.ss_emp_amount,
      ss_er_amount: parsed.ss_er_amount,
      net,
    });
    if (error) throw error;
  }

  // Recalcula totales de cabecera
  await supabase.rpc('recalc_payroll_totals', { payroll: parsed.payrollId }).catch(() => {});

  // Revalida listado del período
  const { data: p } = await supabase
    .from('payrolls').select('period_year, period_month').eq('id', parsed.payrollId).single();

  revalidatePath('/payroll');
  if (p) revalidatePath(`/payroll/period/${p.period_year}/${p.period_month}`);
}

export async function finalizePayrollAction(payrollId: string) {
  const supabase = createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error('No autorizado');

  // marca procesado
  const { error } = await supabase
    .from('payrolls')
    .update({ processed_at: new Date().toISOString(), status: 'procesado' })
    .eq('id', payrollId);
  if (error) throw error;

  // genera PDFs en storage
  await generatePdfsForPayroll(payrollId);

  const { data: p } = await supabase
    .from('payrolls').select('period_year, period_month').eq('id', payrollId).single();

  revalidatePath('/payroll');
  if (p) revalidatePath(`/payroll/period/${p.period_year}/${p.period_month}`);
}

// ====== PDF ======
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function generatePdfsForPayroll(payrollId: string) {
  const supabase = createSupabaseServer();

  const { data: items, error } = await supabase
    .from('payroll_items')
    .select(`
      id, employee_id, base_gross, irpf_amount, ss_emp_amount, ss_er_amount, net,
      employees:employee_id ( full_name, email, position ),
      payrolls:payroll_id ( period_year, period_month )
    `)
    .eq('payroll_id', payrollId);
  if (error) throw error;
  if (!items?.length) return;

  // bucket privado 'nominas'
  for (const it of items) {
    const pdfBytes = await buildPayrollPdf({
      employee: it.employees,
      item: it,
      year: it.payrolls.period_year,
      month: it.payrolls.period_month,
    });

    const filePath = `${it.employee_id}/${it.payrolls.period_year}-${String(it.payrolls.period_month).padStart(2,'0')}/nomina-${it.id}.pdf`;

    // sube al bucket
    const { error: upErr } = await supabase.storage
      .from('nominas')
      .upload(filePath, new Blob([pdfBytes], { type: 'application/pdf' }), { upsert: true });
    if (upErr) throw upErr;

    const pdfUrl = `nominas/${filePath}`;
    await supabase.from('payroll_items').update({ pdf_url: pdfUrl }).eq('id', it.id);
  }
}

async function buildPayrollPdf({ employee, item, year, month }:{
  employee: { full_name: string, email: string, position: string },
  item: any, year: number, month: number
}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const draw = (text: string, x: number, y: number, size = 11) =>
    page.drawText(text, { x, y, size, font, color: rgb(0,0,0) });

  // Encabezado simple
  draw('RECIBO DE SALARIOS', 210, 800, 16);
  draw(`Periodo: ${String(month).padStart(2,'0')}/${year}`, 30, 770);
  draw(`Empleado: ${employee.full_name}`, 30, 750);
  draw(`Puesto: ${employee.position ?? '-'}`, 30, 735);
  draw(`Email: ${employee.email}`, 30, 720);

  // Tabla simple
  const y0 = 680;
  draw('CONCEPTOS', 30, y0);
  draw('Importe (€)', 480, y0);

  draw('Salario bruto', 30, y0 - 25);      draw(format(item.base_gross), 480, y0 - 25);
  draw('IRPF', 30, y0 - 45);               draw(`- ${format(item.irpf_amount)}`, 480, y0 - 45);
  draw('Seg. Social (trab.)', 30, y0 - 65);draw(`- ${format(item.ss_emp_amount)}`, 480, y0 - 65);
  draw('Seg. Social (emp.)', 30, y0 - 85); draw(format(item.ss_er_amount), 480, y0 - 85, );
  draw('Neto a percibir', 30, y0 - 120, 13); draw(format(item.net), 480, y0 - 120, 13);

  return await pdf.save();
}

function format(n: number) { return `€ ${Number(n || 0).toFixed(2)}`; }
