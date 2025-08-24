// app/api/contracts/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

function supabaseServer() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookies().get(name)?.value,
        set: (name, value, opts) => cookies().set(name, value, opts),
        remove: (name, opts) => cookies().set(name, '', { ...opts, maxAge: 0 }),
      },
    }
  );
}

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const { data: { user }, error: uErr } = await supabase.auth.getUser();
  if (uErr || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { template, employee_id, data } = body;

  if (!template || !employee_id) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  }

  const { data: inserted, error } = await supabase
    .from('contracts')
    .insert({
      user_id: user.id,
      employee_id,
      template,
      data,
      status: 'borrador'
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: inserted.id });
}
