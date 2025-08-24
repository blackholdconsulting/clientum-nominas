import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.DEV_ADMIN_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "email y password requeridos" }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // busca el user
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 400 });

  const user = list.users.find(u => u.email?.toLowerCase() === String(email).toLowerCase());
  if (!user) return NextResponse.json({ error: "usuario no encontrado" }, { status: 404 });

  // marca email como confirmado y actualiza contraseña
  const { data, error } = await admin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, id: data.user.id });
}
