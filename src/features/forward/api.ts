// Data access for forward contracts; the only file in this feature that calls supabase.
import { supabase } from "@/lib/supabaseClient";
import {
  createForwardInput, cycleSchema, forwardSchema,
  type CreateForwardInput, type CropCycleOption, type ForwardContract,
} from "./schemas";

const MESSAGES: Record<string, string> = {
  EXCEEDS_EXPECTED_YIELD: "That quantity is more than your remaining expected yield.",
  CYCLE_NOT_GROWING: "Only crops that are still growing can be pre-sold.",
  INVALID_DELIVERY_DATE: "Delivery date must be in the future.",
  ILLEGAL_TRANSITION: "This contract can no longer be changed.",
  NOT_ALLOWED: "You are not allowed to do that.",
};
function fail(message: string, fallback: string): never {
  const code = Object.keys(MESSAGES).find((c) => message.includes(c));
  throw new Error(code ? MESSAGES[code] : fallback);
}

export async function fetchContracts(): Promise<ForwardContract[]> {
  const { data, error } = await supabase.from("forward_contracts").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("Could not load forward contracts.");
  return forwardSchema.array().parse(data ?? []);
}

/** Growing crop cycles on the signed-in farmer's farms. */
export async function fetchMyCycles(userId: string): Promise<CropCycleOption[]> {
  const { data, error } = await supabase
    .from("crop_cycles")
    .select("id, crop_type, status, ai_predicted_yield_kg, farms!inner(user_id)")
    .eq("farms.user_id", userId)
    .eq("status", "GROWING");
  if (error) throw new Error("Could not load your crops.");
  return cycleSchema.array().parse(data ?? []);
}

export async function createContract(input: CreateForwardInput): Promise<void> {
  const v = createForwardInput.parse(input);
  const { error } = await supabase.rpc("create_forward_contract", {
    p_cycle: v.crop_cycle_id, p_qty: v.qty_tons, p_price: v.price_per_ton, p_delivery: v.delivery_date,
  });
  if (error) fail(error.message, "Could not create the contract.");
}

export async function acceptContract(id: string): Promise<void> {
  const { error } = await supabase.rpc("accept_forward_contract", { p_id: id });
  if (error) fail(error.message, "Could not accept the contract.");
}

export async function cancelContract(id: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_forward_contract", { p_id: id });
  if (error) fail(error.message, "Could not cancel the contract.");
}
