// Zod schemas and pure fee math for dynamic platform fees (mirrors the server's compute_platform_fee_bps).
import { z } from "zod";

export const MAX_FEE_BPS = 2000; // 20% hard cap, same as the DB CHECK

export const feeTierSchema = z.object({
  min_order_total: z.coerce.number().min(0),
  rate_bps: z.coerce.number().int().min(0).max(MAX_FEE_BPS),
});
export type FeeTier = z.infer<typeof feeTierSchema>;

/** Validates an edited tier set: unique thresholds and one tier at 0. Returns an error message or null. */
export function validateTiers(tiers: FeeTier[]): string | null {
  if (tiers.length === 0) return "Add at least one tier.";
  if (!tiers.some((t) => t.min_order_total === 0)) return "A tier starting at 0 is required.";
  const thresholds = new Set(tiers.map((t) => t.min_order_total));
  if (thresholds.size !== tiers.length) return "Tier thresholds must be unique.";
  return null;
}

/** Display-only estimate; the server computes the authoritative fee at order placement. */
export function estimateFeeBps(tiers: FeeTier[], total: number): number {
  const match = [...tiers].sort((a, b) => b.min_order_total - a.min_order_total).find((t) => t.min_order_total <= total);
  return match?.rate_bps ?? 300;
}

export const estimateFee = (tiers: FeeTier[], total: number) =>
  Math.round(((total * estimateFeeBps(tiers, total)) / 10000) * 100) / 100;
