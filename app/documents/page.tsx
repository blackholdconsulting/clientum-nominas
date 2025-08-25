import BackButton from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { uploadDocuments, deleteDocument } from "./actions";
import { Download, Trash2, UploadCloud } from "lucide-react";

type DocRow = {
  id: string;
  name: string;
  path: string;
  size: number | null;
  content_type: string | null;
  created_at: string;
  signedUrl?: string | null;
};

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes < 0) return "-";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed( i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export default async function DocumentsPage() {
  const supabase = getSupabaseServerClient();
  const user = await requireUser();

  // Documentos del usuario actual
  const { data: docs } = await supabase
    .from("documents")
    .select("id, name, path, size, content_type, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows: DocRow[] = [];
  for (const d of docs ?? []) {
    const { data: urlData } = await supabase.storage
      .from("documents")
      .createSignedUrl(d.path, 60 * 10); // 10 minutos
    rows.push({ ...d, signedUrl: urlData?.signedUrl ?? null });
  }

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <BackButton />
        <h1 className="text-xl font-semibold text-slate-900">Documentos</h1>
        <div />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Subida */}
        <Card className="shadow-clientum">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Subir documentos</h2>
            <form action={uploadDocuments} encType="multipart/form-data" className="flex items-center gap-3">
              <Input name="files" id="files" type="file" multiple className="max-w-sm" />
              <Button className="bg-clientum-blue hover:bg-clientum-blueDark text-white inline-flex items-center gap-2">
                <UploadCloud className="size-4" /> Subir
              </Button>
            </form>
            <p className="text-xs text-slate-500 mt-2">
              Se guardan en un bucket privado de Supabase. Extensiones permitidas comunes (PDF, DOCX, PNG, JPG, ZIP, etc.).
            </p>
          </CardContent>
        </Card>

        {/* Listado */}
        <Card className="shadow-clientum">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rows ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                      No hay documentos aún.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell>{formatBytes(d.size ?? undefined)}</TableCell>
                      <TableCell>{d.content_type ?? "-"}</TableCell>
                      <TableCell>{new Date(d.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {d.signedUrl ? (
                            <a
                              href={d.signedUrl}
                              target="_blank"
                              className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 bg-white border text-slate-700 hover:bg-slate-50"
                            >
                              <Download className="size-4" /> Descargar
                            </a>
                          ) : null}
                          <form action={deleteDocument}>
                            <input type="hidden" name="id" value={d.id} />
                            <Button
                              type="submit"
                              variant="destructive"
                              className="inline-flex items-center gap-1"
                            >
                              <Trash2 className="size-4" /> Eliminar
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
