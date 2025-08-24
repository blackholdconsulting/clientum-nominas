"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Printer, FileText } from "lucide-react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { saveAs } from "file-saver"

// Ajusta a tu helper real
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const TEMPLATES_BUCKET = "contract-templates"

// Helpers simples
async function fetchText(url: string) {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`Fetch error ${res.status}`)
  return await res.text()
}

export default function EditContractModel() {
  const params = useParams<{ key: string }>()
  const search = useSearchParams()
  const router = useRouter()

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [employeeId, setEmployeeId] = useState<string>(search.get("employeeId") || "")
  const [employeeName, setEmployeeName] = useState<string>(search.get("employeeName") || "")

  // Para demo: plantillas html públicas en storage (hazlas públicas o usa signed URL)
  const templateUrl = useMemo(() => {
    // ejemplo: https://<project>.supabase.co/storage/v1/object/public/contract-templates/CIND-2504-CAS-C.html
    return `${SUPABASE_URL}/storage/v1/object/public/${TEMPLATES_BUCKET}/${params.key}.html`
  }, [params.key])

  // Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder:
          "Cargando plantilla… o empieza a escribir. Puedes usar {{placeholders}} y luego reemplazarlos.",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral max-w-none focus:outline-none min-h-[500px] print:prose-sm",
      },
    },
  })

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        // Carga HTML template desde Storage
        const html = await fetchText(templateUrl)
        // Inyecta algunos placeholders por comodidad
        const hydrated = html
          .replaceAll("{{employee_name}}", employeeName || "Nombre del empleado")
          .replaceAll("{{employee_id}}", employeeId || "ID")
        editor?.commands.setContent(hydrated || "")
      } catch (e: any) {
        setError(e?.message ?? "Error cargando plantilla")
      } finally {
        setLoading(false)
      }
    })()
  }, [templateUrl, employeeId, employeeName, editor])

  function onPrint() {
    // abre el diálogo de impresión del navegador
    window.print()
  }

  async function onExportDocx() {
    // Exporta el HTML actual a DOCX (simple, no perfecto)
    const html = editor?.getHTML() || ""
    const { default: htmlDocx } = await import("html-docx-js/dist/html-docx")
    const blob = htmlDocx.asBlob(`<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>${html}</body></html>`)
    saveAs(blob, `${params.key}-${employeeName || "sin-nombre"}.docx`)
  }

  async function onSave() {
    try {
      setError(null)
      const html = editor?.getHTML() || ""
      if (!employeeId) {
        setError("Falta employeeId")
        return
      }

      const payload = {
        html,
        key: params.key,
        employeeId,
        metadata: {
          user_id: (window as any).__userId || "", // según tu auth, pásalo aquí
          employee_name: employeeName,
          data: {
            employee_name: employeeName,
            employee_id: employeeId,
          },
        },
      }

      const res = await fetch("/api/contracts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Error guardando")
      }

      alert("Borrador guardado")
      // Redirige a ver contrato si quieres
      // router.push(`/contracts/${data.contractId}`)
    } catch (e: any) {
      setError(e?.message ?? "Error guardando")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Cargando plantilla…</CardTitle>
          </CardHeader>
          <CardContent>Por favor espera.</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" onClick={() => router.push("/contracts/models")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onExportDocx}>
            <FileText className="w-4 h-4 mr-2" />
            Exportar DOCX
          </Button>
          <Button variant="outline" onClick={onPrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={onSave}>
            <Save className="w-4 h-4 mr-2" />
            Guardar borrador
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editor: {params.key}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Empleado ID</Label>
              <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="uuid empleado" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Nombre del empleado</Label>
              <Input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} placeholder="Nombre completo" />
            </div>
          </div>

          <Separator className="my-4" />
          {error && (
            <div className="text-sm text-red-600 mb-3">{error}</div>
          )}
          <div className="border rounded-md p-3 bg-white">
            <EditorContent editor={editor} />
          </div>
        </CardContent>
      </Card>

      {/* Estilos de impresión simples */}
      <style jsx global>{`
        @media print {
          header, nav, .no-print, button { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  )
}
