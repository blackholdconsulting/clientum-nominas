import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.DEV_ADMIN_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email requerido" }, { status: 400 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const user = data.users.find(u => u.email?.toLowerCase() === String(email).toLowerCase());
  if (!user) return NextResponse.json({ found: false });

  return NextResponse.json({
    found: true,
    id: user.id,
    email: user.email,
    email_confirmed: !!user.email_confirmed_at,
    banned_until: user.banned_until,
    identities: user.identities?.map(i => i.provider),
    created_at: user.created_at
  });
}
