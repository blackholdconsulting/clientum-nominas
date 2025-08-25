// app/employees/page.tsx
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function EmployeesPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (!user || userErr) {
    // Si llegas aquí sin sesión, vuelve al login
    redirect("/auth?redirect=/employees");
  }

  // ya hay user seguro
  const { data: employees, error } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", user.id)
    .order("first_name", { ascending: true });

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Error cargando empleados: {error.message}
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Empleados</h1>
      {(!employees || employees.length === 0) ? (
        <p className="text-slate-600">No hay empleados.</p>
      ) : (
        <ul className="space-y-2">
          {employees.map((e) => (
            <li key={e.id} className="rounded border p-3 bg-white shadow-sm">
              {e.first_name} {e.last_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
