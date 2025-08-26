export type Payroll = {
  id: string;
  year: number;
  month: number;
  status?: string | null;
  org_id?: string | null;
  organization_id?: string | null;
  irpf_pct?: number | null;      // override periodo (IRPF trabajador)
  ss_emp_pct?: number | null;    // override periodo (SS trabajador)
  days_in_period?: number | null;
};

export type Employee = {
  id: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  position?: string | null;
  job_title?: string | null;
  irpf_pct?: number | null;  // por defecto (trabajador)
  ss_emp_pct?: number | null; // SS trabajador (por defecto)
  ss_er_pct?: number | null;  // SS empresa
  iban?: string | null;
  national_id?: string | null;
  ssn?: string | null;
};

export type PayrollItem = {
  id: string;
  payroll_id: string;
  employee_id: string;
  type: "earning" | "deduction" | string | null;
  concept?: string | null;
  description?: string | null;
  quantity?: number | null;
  amount?: number | null;
  cotizable?: boolean | null;
  sujeto_irpf?: boolean | null;
  category?: "salarial" | "no_salarial" | null;
  concept_code?: string | null;
  notes?: string | null;
};
