// Data access for RFQs and bids; the only file in this feature that calls supabase.
import { supabase } from "@/lib/supabaseClient";
import {
  bidSchema, rfqSchema, createRfqInput, bidInput,
  type Bid, type BidInput, type CreateRfqInput, type Rfq,
} from "./schemas";

// Map server error codes to user-safe messages.
const MESSAGES: Record<string, string> = {
  RFQ_CLOSED: "This request is closed.",
  PRICE_ABOVE_MAX: "Your price is above the buyer's maximum.",
  QTY_ABOVE_REQUESTED: "Your quantity is above what was requested.",
  INVALID_DEADLINE: "Deadline must be between 1 hour and 90 days from now.",
  ILLEGAL_TRANSITION: "This action is no longer possible.",
  NOT_ALLOWED: "You are not allowed to do that.",
};
function fail(message: string, fallback: string): never {
  const code = Object.keys(MESSAGES).find((c) => message.includes(c));
  throw new Error(code ? MESSAGES[code] : fallback);
}

export async function fetchRfqs(): Promise<Rfq[]> {
  const { data, error } = await supabase.from("rfqs").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("Could not load requests.");
  return rfqSchema.array().parse(data ?? []);
}

export async function fetchBids(): Promise<Bid[]> {
  const { data, error } = await supabase.from("rfq_bids").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("Could not load bids.");
  return bidSchema.array().parse(data ?? []);
}

export async function createRfq(input: CreateRfqInput): Promise<void> {
  const v = createRfqInput.parse(input);
  const { error } = await supabase.rpc("create_rfq", {
    p_crop: v.crop_type, p_qty: v.qty_tons, p_max_price: v.max_price_per_ton,
    p_deadline: new Date(v.deadline).toISOString(), p_notes: v.notes ?? null,
  });
  if (error) fail(error.message, "Could not create the request.");
}

export async function submitBid(rfqId: string, input: BidInput): Promise<void> {
  const v = bidInput.parse(input);
  const { error } = await supabase.rpc("submit_bid", {
    p_rfq_id: rfqId, p_price: v.price_per_ton, p_qty: v.qty_tons, p_note: v.note ?? null,
  });
  if (error) fail(error.message, "Could not submit your bid.");
}

export async function withdrawBid(bidId: string): Promise<void> {
  const { error } = await supabase.rpc("withdraw_bid", { p_bid_id: bidId });
  if (error) fail(error.message, "Could not withdraw the bid.");
}

export async function awardBid(bidId: string): Promise<void> {
  const { error } = await supabase.rpc("award_bid", { p_bid_id: bidId });
  if (error) fail(error.message, "Could not accept the bid.");
}

export async function cancelRfq(rfqId: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_rfq", { p_rfq_id: rfqId });
  if (error) fail(error.message, "Could not cancel the request.");
}
