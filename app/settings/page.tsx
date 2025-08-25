import BackButton from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { updateAccount, updateCompany } from "./actions";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function SettingsPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const saved = typeof searchParams?.saved === "string" ? searchParams.saved : undefined;

  const supabase = getSupabaseServerClient();

  // Usuario
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Si quieres redirigir al login:
    // redirect("/auth");
    return (
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">Ajustes</h1>
        <p className="text-red-600">No hay usuario autenticado. Inicia sesión nuevamente.</p>
      </main>
    );
  }

  // Perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  // Empresa
  const { data: company } = await supabase
    .from("companies")
    .select("name, cif")
    .eq("owner_id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ajustes</h1>
        <BackButton />
      </div>

      {saved ? (
        <div className="mb-6 rounded-md border border-clientum-blue bg-blue-50 px-4 py-3 text-sm text-clientum-blue">
          {saved === "account" && "Cambios de cuenta guardados correctamente."}
          {saved === "company" && "Cambios de empresa guardados correctamente."}
        </div>
      ) : null}

      <p className="text-slate-600 mb-8">
        Configura la información general de tu cuenta y de la empresa. 
        Estos datos se utilizarán en los documentos y nóminas generados.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Ajustes de cuenta */}
        <Card className="shadow-clientum">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Cuenta</h2>

            <form action={updateAccount} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nombre</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  placeholder="Tu nombre completo"
                  defaultValue={profile?.full_name ?? ""}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  defaultValue={profile?.email ?? user.email ?? ""}
                  required
                />
              </div>
              <Button className="bg-clientum-blue hover:bg-clientum-blueDark text-white mt-2">
                Guardar cambios
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Ajustes de empresa */}
        <Card className="shadow-clientum">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Empresa</h2>

            <form action={updateCompany} className="space-y-4">
              <div>
                <Label htmlFor="company_name">Razón Social</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  placeholder="Nombre de la empresa"
                  defaultValue={company?.name ?? ""}
                  required
                />
              </div>
              <div>
                <Label htmlFor="company_cif">CIF/NIF</Label>
                <Input
                  id="company_cif"
                  name="company_cif"
                  placeholder="B12345678"
                  defaultValue={company?.cif ?? ""}
                  required
                />
              </div>
              <Button className="bg-clientum-blue hover:bg-clientum-blueDark text-white mt-2">
                Guardar cambios
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
