import BackButton from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ajustes</h1>
        <BackButton />
      </div>

      <p className="text-slate-600 mb-8">
        Configura la información general de tu cuenta y de la empresa. 
        Estos datos se utilizarán en los documentos y nóminas generados.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Ajustes de cuenta */}
        <Card className="shadow-clientum">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Cuenta</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" placeholder="Tu nombre completo" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="correo@ejemplo.com" />
              </div>
              <Button className="bg-clientum-blue hover:bg-clientum-blueDark text-white mt-2">
                Guardar cambios
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ajustes de empresa */}
        <Card className="shadow-clientum">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Empresa</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="company">Razón Social</Label>
                <Input id="company" placeholder="Nombre de la empresa" />
              </div>
              <div>
                <Label htmlFor="cif">CIF/NIF</Label>
                <Input id="cif" placeholder="B12345678" />
              </div>
              <Button className="bg-clientum-blue hover:bg-clientum-blueDark text-white mt-2">
                Guardar cambios
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
