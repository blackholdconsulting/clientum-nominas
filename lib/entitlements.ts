import { supabaseServer } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export async function assertNominasAccess(orgId: string) {
  const { supabase, user } = await requireUser();

  // Asegura que el usuario pertenece a la organización
  const { data: membership, error: mErr } = await supabase
    .from("core.memberships")
    .select("organization_id")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (mErr || !membership) throw new Error("FORBIDDEN");

  // Comprueba entitlement
  const { data: ent } = await supabase
    .from("billing.nominas_entitlement")
    .select("has_access")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!ent?.has_access) throw new Error("NO_ACCESS");
  return true;
}
