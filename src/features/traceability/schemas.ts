// Zod schemas and pure provenance calculations for consumer traceability.
import { z } from "zod";

export const publicTraceSchema = z.object({
  order_id: z.string().uuid(),
  batch_status: z.string(),
  qr_delivery_hash: z.string(),
  crop_type: z.string(),
  quality_grade: z.string(),
  quantity_tons: z.coerce.number(),
  sown_date: z.string().nullable(),
  harvest_date: z.string().nullable(),
  delivered_at: z.string().nullable(),
  farm: z.object({
    name: z.string(),
    location: z.string(),
    hectares: z.coerce.number().nullable(),
    farmer_name: z.string(),
  }),
  environmental: z.object({
    avg_ndvi: z.coerce.number(),
    rainfall_mm: z.coerce.number(),
    telemetry_points: z.coerce.number(),
    carbon_offset_kg: z.coerce.number(),
  }),
});
export type PublicTrace = z.infer<typeof publicTraceSchema>;

/** Calculates freshness index based on days elapsed between harvest/delivery and today. */
export function calculateFreshnessScore(deliveredOrHarvestDate: string | null, now = new Date()): { score: number; label: string } {
  if (!deliveredOrHarvestDate) return { score: 90, label: "Freshly Harvested" };
  const date = new Date(deliveredOrHarvestDate);
  if (isNaN(date.getTime())) return { score: 90, label: "Freshly Harvested" };
  const diffDays = Math.max(0, Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)));
  if (diffDays <= 2) return { score: 98, label: "Peak Farm-Fresh (0-48h)" };
  if (diffDays <= 7) return { score: 92, label: "Fresh Harvest (<1 week)" };
  if (diffDays <= 14) return { score: 85, label: "Standard Distribution" };
  return { score: 75, label: "Long-Storage / Grains" };
}

/** Formatting helper for provenance trust badges. */
export function getTrustBadges(trace: PublicTrace): string[] {
  const badges: string[] = ["100% Direct from Farm", "Middleman Bypassed"];
  if (trace.environmental.avg_ndvi >= 0.7) badges.push("Satellite-Verified Health");
  if (trace.batch_status === "DELIVERED" || trace.batch_status === "RELEASED") badges.push("Cryptographic Proof of Delivery");
  return badges;
}
