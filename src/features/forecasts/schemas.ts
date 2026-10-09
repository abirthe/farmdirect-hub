// Zod schemas and presentation helpers for macroeconomic demand forecasts and shortage alerts.
import { z } from "zod";

export const shortageRiskSchema = z.enum(["NONE", "MODERATE", "SEVERE"]);
export type ShortageRisk = z.infer<typeof shortageRiskSchema>;

export const regionalForecastSchema = z.object({
  id: z.string().uuid(),
  region: z.string().min(1),
  crop_type: z.string().min(1),
  forecast_month: z.string(),
  projected_demand_tons: z.coerce.number(),
  projected_supply_tons: z.coerce.number(),
  deficit_surplus_tons: z.coerce.number(),
  shortage_risk: shortageRiskSchema,
  recommended_action: z.string(),
  historical_price_benchmark_usd: z.coerce.number(),
  projected_price_benchmark_usd: z.coerce.number(),
  price_trend_pct: z.coerce.number(),
  confidence_score: z.coerce.number(),
  updated_at: z.string(),
});
export type RegionalForecast = z.infer<typeof regionalForecastSchema>;

export function formatShortageRisk(risk: ShortageRisk): {
  label: string;
  badgeClass: string;
  severity: "low" | "medium" | "high";
} {
  switch (risk) {
    case "SEVERE":
      return {
        label: "Critical Shortage Alert",
        badgeClass: "bg-red-500/10 text-red-600 border-red-500/30",
        severity: "high",
      };
    case "MODERATE":
      return {
        label: "Supply Tightness",
        badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/30",
        severity: "medium",
      };
    case "NONE":
    default:
      return {
        label: "Balanced / Surplus",
        badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
        severity: "low",
      };
  }
}

export function formatDeficit(deficitTons: number): {
  formatted: string;
  isDeficit: boolean;
  colorClass: string;
} {
  const isDeficit = deficitTons < 0;
  const absVal = Math.abs(deficitTons).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return {
    formatted: isDeficit ? `-${absVal} tons deficit` : `+${absVal} tons surplus`,
    isDeficit,
    colorClass: isDeficit ? "text-red-500" : "text-emerald-500",
  };
}
