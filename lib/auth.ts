import { supabaseServer } from './supabase/server'

export async function requireUser() {
  const supabase = supabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error('UNAUTHENTICATED')
  return { supabase, user }
}
