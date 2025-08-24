export type ContractStatus = "Activo" | "Próximo a Vencer" | "Finalizado";
export type ContractType =
  | "Indefinido"
  | "Temporal"
  | "Formación"
  | "Prácticas"
  | "Fijo-discontinuo";

export interface Contract {
  id: string;
  user_id: string;
  employee_id: string;
  employee_name: string;
  contract_type: ContractType;
  position: string | null;
  department: string | null;
  start_date: string;   // ISO date
  end_date: string | null;
  salary: number | null;
  status: ContractStatus;
  renewal_date: string | null;
  payload: Record<string, any>;
  created_at: string;
  updated_at: string;
}
