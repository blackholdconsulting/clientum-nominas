export type ModeloKey =
  | "CIND-2504-CAS-C"   // Indefinido
  | "CTEM-2505-CAS-C"   // Temporal
  | "CFEA-2504-CAS-C"   // Formación en alternancia
  | "CFOPP-2504-CAS-C"  // Formativo práctica profesional
  | "CPES-2504-CAS-C"   // Especial
  | "ANEXO-MOD-191-2411-CAS-C"
  | "ANEXO-MOD-192-2411-CAS-C"
  | "ANEXO_200_2411_CAS-C";

export async function buildPdfPayload(modelo: ModeloKey, data: Record<string, any>) {
  // Aquí validas campos según el modelo.
  // De momento devolvemos tal cual (sirve para firmar/generar después).
  return { modelo, ...data };
}

// Si luego integras Supabase Storage:
export async function savePdfToStorage(_opts: {
  userId: string;
  contractId: string;
  fileName: string;
  file: Blob;
}) {
  // Implementación futura: supabase.storage.from("contracts").upload(...)
  return { storage_path: "" };
}
