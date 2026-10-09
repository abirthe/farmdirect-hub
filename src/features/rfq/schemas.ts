// Zod schemas and pure helpers for RFQs and bids.
import { z } from "zod";

export const rfqStatusSchema = z.enum(["OPEN", "AWARDED", "CANCELLED"]);
export const bidStatusSchema = z.enum(["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN"]);

export const rfqSchema = z.object({
  id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  crop_type: z.string(),
  qty_tons: z.coerce.number(),
  max_price_per_ton: z.coerce.number(),
  deadline: z.string(),
  notes: z.string().nullable(),
  status: rfqStatusSchema,
  awarded_bid_id: z.string().uuid().nullable(),
  created_at: z.string(),
});
export type Rfq = z.infer<typeof rfqSchema>;

export const bidSchema = z.object({
  id: z.string().uuid(),
  rfq_id: z.string().uuid(),
  farmer_id: z.string().uuid(),
  price_per_ton: z.coerce.number(),
  qty_tons: z.coerce.number(),
  note: z.string().nullable(),
  status: bidStatusSchema,
  created_at: z.string(),
});
export type Bid = z.infer<typeof bidSchema>;

export const createRfqInput = z.object({
  crop_type: z.string().trim().min(2, "Crop is required").max(80),
  qty_tons: z.coerce.number().positive("Quantity must be positive"),
  max_price_per_ton: z.coerce.number().positive("Max price must be positive"),
  deadline: z.string().min(1, "Deadline is required"),
  notes: z.string().max(1000).optional(),
});
export type CreateRfqInput = z.infer<typeof createRfqInput>;

export const bidInput = z.object({
  price_per_ton: z.coerce.number().positive("Price must be positive"),
  qty_tons: z.coerce.number().positive("Quantity must be positive"),
  note: z.string().max(500).optional(),
});
export type BidInput = z.infer<typeof bidInput>;

/** Expiry is derived from the deadline (server also enforces it on submit). */
export const isRfqExpired = (rfq: Pick<Rfq, "deadline">, now = new Date()) => new Date(rfq.deadline) <= now;

/** Lowest-priced pending bid first; ties broken by larger quantity. */
export function rankBids(bids: Bid[]): Bid[] {
  return bids
    .filter((b) => b.status === "PENDING")
    .sort((a, b) => a.price_per_ton - b.price_per_ton || b.qty_tons - a.qty_tons);
}

/** Client-side pre-check mirroring server rules, for instant form feedback. */
export function validateBid(rfq: Rfq, input: BidInput): string | null {
  if (input.price_per_ton > rfq.max_price_per_ton) return `Price cannot exceed ${rfq.max_price_per_ton} per ton.`;
  if (input.qty_tons > rfq.qty_tons) return `Quantity cannot exceed ${rfq.qty_tons} tons.`;
  return null;
}
