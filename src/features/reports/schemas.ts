// Zod schemas and presentation helpers for data monetization and regional commodity reporting.
import { z } from "zod";

export const reportTypeSchema = z.enum([
  "YIELD_BENCHMARK",
  "CLIMATE_IMPACT",
  "REGIONAL_INDEX",
  "PRICE_VOLATILITY",
]);
export type ReportType = z.infer<typeof reportTypeSchema>;

export const accessTierSchema = z.enum([
  "PUBLIC_SUMMARY",
  "PREMIUM_TRADER",
  "GOVERNMENT_INSTITUTIONAL",
]);
export type AccessTier = z.infer<typeof accessTierSchema>;

export const reportMetricsSchema = z.object({
  total_sample_hectares: z.coerce.number().default(0),
  mean_ndvi: z.coerce.number().default(0),
  avg_yield_tons_ha: z.coerce.number().default(0),
  projected_gross_tons: z.coerce.number().default(0),
  historical_variance_pct: z.coerce.number().default(0),
  participating_farms: z.coerce.number().optional(),
});
export type ReportMetrics = z.infer<typeof reportMetricsSchema>;

export const commodityReportSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  report_type: reportTypeSchema,
  period: z.string(),
  regions: z.array(z.string()).or(z.string().transform((s) => [s])),
  summary: z.string(),
  tier: accessTierSchema,
  price_usd: z.coerce.number(),
  metrics: reportMetricsSchema.or(z.record(z.any())),
  download_count: z.coerce.number(),
  created_at: z.string(),
});
export type CommodityReport = z.infer<typeof commodityReportSchema>;

export const regionalIndexItemSchema = z.object({
  region: z.string(),
  crop_type: z.string(),
  active_cycles_count: z.coerce.number(),
  total_hectares: z.coerce.number(),
  mean_ndvi_score: z.coerce.number(),
  projected_volume_tons: z.coerce.number(),
});
export type RegionalIndexItem = z.infer<typeof regionalIndexItemSchema>;

export function formatReportType(type: ReportType): {
  label: string;
  badgeClass: string;
} {
  switch (type) {
    case "YIELD_BENCHMARK":
      return { label: "Yield Trajectory", badgeClass: "bg-primary/10 text-primary border-primary/30" };
    case "CLIMATE_IMPACT":
      return { label: "Climate & Satellite", badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/30" };
    case "PRICE_VOLATILITY":
      return { label: "Price Elasticity", badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/30" };
    case "REGIONAL_INDEX":
    default:
      return { label: "Regional Supply Index", badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" };
  }
}

export function formatAccessTier(tier: AccessTier): {
  label: string;
  badgeClass: string;
} {
  switch (tier) {
    case "GOVERNMENT_INSTITUTIONAL":
      return { label: "Institutional / Gov", badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/30" };
    case "PREMIUM_TRADER":
      return { label: "Trader Premium", badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/30" };
    case "PUBLIC_SUMMARY":
    default:
      return { label: "Open Public Summary", badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" };
  }
}
