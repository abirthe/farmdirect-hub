// Data access for disputes; the only file in this feature that calls supabase.
import { supabase } from "@/lib/supabaseClient";
import {
  disputeSchema, eligibleOrderSchema, evidenceSchema, openDisputeInput, resolveInput, triageReportSchema,
  type Dispute, type EligibleOrder, type Evidence, type OpenDisputeInput, type ResolveInput, type TriageReport,
} from "./schemas";

const MESSAGES: Record<string, string> = {
  ILLEGAL_TRANSITION: "This dispute or order can no longer be changed.",
  NOT_ALLOWED: "You are not allowed to do that.",
  NOTE_REQUIRED: "A resolution note is required.",
  "uniq_open_dispute_per_order": "This order already has an open dispute.",
};
function fail(message: string, fallback: string): never {
  const code = Object.keys(MESSAGES).find((c) => message.includes(c));
  throw new Error(code ? MESSAGES[code] : fallback);
}

export async function fetchDisputes(): Promise<Dispute[]> {
  const { data, error } = await supabase
    .from("disputes").select("*, orders(total_price)").order("created_at", { ascending: false });
  if (error) throw new Error("Could not load disputes.");
  return disputeSchema.array().parse(data ?? []);
}

export async function fetchEvidence(): Promise<Evidence[]> {
  const { data, error } = await supabase.from("dispute_evidence").select("*").order("created_at", { ascending: true });
  if (error) throw new Error("Could not load evidence.");
  return evidenceSchema.array().parse(data ?? []);
}

export async function fetchEligibleOrders(): Promise<EligibleOrder[]> {
  const { data, error } = await supabase
    .from("orders").select("id, status, total_price").in("status", ["ESCROW_LOCKED", "IN_TRANSIT", "DELIVERED"]);
  if (error) throw new Error("Could not load your orders.");
  return eligibleOrderSchema.array().parse(data ?? []);
}

export async function openDispute(input: OpenDisputeInput): Promise<void> {
  const v = openDisputeInput.parse(input);
  const { error } = await supabase.rpc("open_dispute", { p_order_id: v.order_id, p_reason: v.reason, p_description: v.description });
  if (error) fail(error.message, "Could not open the dispute.");
}

export async function addEvidence(disputeId: string, body: string): Promise<void> {
  const text = body.trim();
  if (!text) throw new Error("Evidence cannot be empty.");
  const { error } = await supabase.rpc("add_dispute_evidence", { p_dispute_id: disputeId, p_body: text });
  if (error) fail(error.message, "Could not add evidence.");
}

export async function resolveDispute(disputeId: string, input: ResolveInput): Promise<void> {
  const v = resolveInput.parse(input);
  const { error } = await supabase.rpc("resolve_dispute", { p_dispute_id: disputeId, p_outcome: v.outcome, p_note: v.note });
  if (error) fail(error.message, "Could not resolve the dispute.");
}

export async function triageDispute(disputeId: string): Promise<TriageReport> {
  const { data, error } = await supabase.rpc("triage_dispute", { p_dispute_id: disputeId });
  if (error) fail(error.message, "Could not run AI triage on this dispute.");
  return triageReportSchema.parse(data);
}
