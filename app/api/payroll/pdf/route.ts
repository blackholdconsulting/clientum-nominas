export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path'); // ej: nominas/<employee_id>/2025-07/nomina-uuid.pdf
  if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 });

  const supabase = createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // descarga del bucket privado
  const { data, error } = await supabase.storage.from('nominas').download(path.replace(/^nominas\//,''));
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  return new NextResponse(data, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${path.split('/').pop()}"`,
    },
  });
}
