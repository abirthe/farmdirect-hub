// Zod schemas and credit rating helpers for micro-financing and parametric insurance.
import { z } from "zod";

export const riskTierSchema = z.enum(["AAA", "AA", "A", "BBB", "HIGH_RISK"]);
export type RiskTier = z.infer<typeof riskTierSchema>;

export const underwritingPassportSchema = z.object({
  id: z.string().uuid(),
  farmer_id: z.string().uuid(),
  crop_cycle_id: z.string().uuid(),
  risk_tier: riskTierSchema,
  credit_score: z.coerce.number(),
  max_eligible_credit: z.coerce.number(),
  parametric_coverage: z.coerce.number(),
  ndvi_stability_index: z.coerce.number(),
  weather_hazard_index: z.coerce.number(),
  passport_hash: z.string(),
  metrics_snapshot: z.record(z.unknown()),
  created_at: z.string(),
});
export type UnderwritingPassport = z.infer<typeof underwritingPassportSchema>;

export const TIER_CONFIG: Record<RiskTier, { label: string; interestRateApr: string; color: string }> = {
  AAA: { label: "Prime Agricultural Tier", interestRateApr: "4.5% - 6.0%", color: "text-emerald-600 border-emerald-500" },
  AA: { label: "High Grade Low Risk", interestRateApr: "6.5% - 7.5%", color: "text-emerald-500 border-emerald-400" },
  A: { label: "Upper Medium Grade", interestRateApr: "8.0% - 9.5%", color: "text-blue-500 border-blue-400" },
  BBB: { label: "Standard Farm Grade", interestRateApr: "10.0% - 12.0%", color: "text-amber-500 border-amber-400" },
  HIGH_RISK: { label: "Sub-prime / Elevated Variance", interestRateApr: "14.0%+", color: "text-destructive border-destructive" },
};

export function getParametricPayoutTrigger(hazardIndex: number): string {
  if (hazardIndex < 0.2) return "Low Hazard: Payout triggers if rainfall deviates >40% or NDVI drops <0.60";
  if (hazardIndex < 0.4) return "Moderate Hazard: Payout triggers if continuous drought exceeds 14 days";
  return "Elevated Hazard: Strict monitoring; payout triggers on verified local flood or heatwave";
}
