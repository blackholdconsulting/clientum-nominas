// app/org/select/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export default async function OrgSelectPage() {
  const user = await requireUser();
  const supabase = supabaseServer();

  // Ejemplo: listar organizaciones (ajusta a tu esquema real)
  const { data: orgs, error } = await supabase
    .from("orgs")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold mb-2">Organizaciones</h1>
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Selecciona tu organización</h1>
      <ul className="space-y-3">
        {(orgs ?? []).map((o) => (
          <li key={o.id} className="border rounded-md p-4 flex items-center justify-between">
            <span className="font-medium">{o.name}</span>
            <Link
              href={`/`}
              className="inline-flex items-center rounded-md bg-emerald-700 text-white px-4 py-2 hover:bg-emerald-800"
            >
              Entrar
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
