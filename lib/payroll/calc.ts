import type { PayrollItem } from "./types";

export type CalcInput = {
  items: Pick<PayrollItem, "type" | "amount" | "cotizable" | "sujeto_irpf">[];
  pctIrpf: number;   // % IRPF trabajador
  pctSsEmp: number;  // % SS trabajador
  pctSsEr: number;   // % SS empresa
};

export type CalcOutput = {
  totalDevengos: number;
  totalDeduccionesManuales: number;
  baseCotizacion: number;
  baseIRPF: number;
  ssTrab: number;
  irpf: number;
  totalDeducciones: number;
  neto: number;
  ssEmp: number;           // coste empresa (informativo)
};

const toNum = (x: any, d = 0) => {
  const v = typeof x === "string" ? x.replace(",", ".") : x;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export function compute(input: CalcInput): CalcOutput {
  const items = input.items ?? [];
  const get = (p: (i: any) => boolean) => items.filter(p).map((i) => toNum(i.amount, 0));

  const totalDevengos = sum(get((i) => (i.type ?? "").toLowerCase() === "earning"));
  const totalDeduccionesManuales = sum(get((i) => (i.type ?? "").toLowerCase() === "deduction"));
  const baseCotizacion = sum(get((i) => i.cotizable ?? true));
  const baseIRPF = sum(get((i) => i.sujeto_irpf ?? true));

  const ssTrab = baseCotizacion * (toNum(input.pctSsEmp, 0) / 100);
  const irpf = baseIRPF * (toNum(input.pctIrpf, 0) / 100);
  const totalDeducciones = totalDeduccionesManuales + ssTrab + irpf;
  const neto = totalDevengos - totalDeducciones;

  const ssEmp = baseCotizacion * (toNum(input.pctSsEr, 0) / 100);

  return { totalDevengos, totalDeduccionesManuales, baseCotizacion, baseIRPF, ssTrab, irpf, totalDeducciones, neto, ssEmp };
}

function sum(xs: number[]) {
  let t = 0;
  for (let i = 0; i < xs.length; i++) t += xs[i];
  return t;
}
