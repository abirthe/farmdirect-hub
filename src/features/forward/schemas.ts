// Zod schemas and pure helpers for forward contracts.
import { z } from "zod";

export const forwardStatusSchema = z.enum(["OFFERED", "ACCEPTED", "CANCELLED"]);

export const forwardSchema = z.object({
  id: z.string().uuid(),
  farmer_id: z.string().uuid(),
  crop_cycle_id: z.string().uuid(),
  buyer_id: z.string().uuid().nullable(),
  qty_tons: z.coerce.number(),
  price_per_ton: z.coerce.number(),
  delivery_date: z.string(),
  status: forwardStatusSchema,
  accepted_at: z.string().nullable(),
  created_at: z.string(),
});
export type ForwardContract = z.infer<typeof forwardSchema>;

export const cycleSchema = z.object({
  id: z.string().uuid(),
  crop_type: z.string(),
  status: z.string().nullable(),
  ai_predicted_yield_kg: z.coerce.number().nullable(),
});
export type CropCycleOption = z.infer<typeof cycleSchema>;

export const createForwardInput = z.object({
  crop_cycle_id: z.string().uuid("Choose a crop"),
  qty_tons: z.coerce.number().positive("Quantity must be positive"),
  price_per_ton: z.coerce.number().positive("Price must be positive"),
  delivery_date: z.string().min(1, "Delivery date is required"),
});
export type CreateForwardInput = z.infer<typeof createForwardInput>;

/** Tons still available to pre-sell: predicted yield minus open offers and accepted contracts. */
export function remainingCapacityTons(cycle: CropCycleOption, contracts: ForwardContract[]): number {
  const committed = contracts
    .filter((c) => c.crop_cycle_id === cycle.id && (c.status === "OFFERED" || c.status === "ACCEPTED"))
    .reduce((sum, c) => sum + c.qty_tons, 0);
  return Math.max(0, Math.round(((cycle.ai_predicted_yield_kg ?? 0) / 1000 - committed) * 1000) / 1000);
}

export const contractValue = (c: Pick<ForwardContract, "qty_tons" | "price_per_ton">) =>
  Math.round(c.qty_tons * c.price_per_ton * 100) / 100;

export const isPastDelivery = (c: Pick<ForwardContract, "delivery_date">, now = new Date()) =>
  new Date(c.delivery_date + "T23:59:59") < now;
