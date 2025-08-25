export async function uploadPdf({
  supabase,
  bytes,
  path,
}: {
  supabase: any;
  bytes: Uint8Array;
  path: string; // 'userId/2025-08/employeeId.pdf'
}) {
  const { error } = await supabase.storage.from("documents").upload(path, bytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw error;
}
