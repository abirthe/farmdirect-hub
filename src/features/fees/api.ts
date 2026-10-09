// Data access for fee tiers; the only file in this feature that calls supabase.
import { supabase } from "@/lib/supabaseClient";
import { feeTierSchema, validateTiers, type FeeTier } from "./schemas";

export async function fetchFeeTiers(): Promise<FeeTier[]> {
  const { data, error } = await supabase
    .from("fee_tiers")
    .select("min_order_total, rate_bps")
    .order("min_order_total", { ascending: true });
  if (error) throw new Error("Could not load fee tiers.");
  return feeTierSchema.array().parse(data ?? []);
}

export async function saveFeeTiers(tiers: FeeTier[]): Promise<void> {
  const parsed = feeTierSchema.array().parse(tiers);
  const problem = validateTiers(parsed);
  if (problem) throw new Error(problem);
  const { error } = await supabase.rpc("set_fee_tiers", { p_tiers: parsed });
  if (error) throw new Error("Could not save fee tiers. Admin access is required.");
}
