// Zod schemas and pure helpers for disputes.
import { z } from "zod";

export const REASONS = ["WEIGHT_MISMATCH", "QUALITY_MISMATCH", "NON_DELIVERY", "OTHER"] as const;
export const reasonSchema = z.enum(REASONS);
export const disputeStatusSchema = z.enum(["OPEN", "RESOLVED_RELEASE", "RESOLVED_REFUND"]);
export type DisputeReason = z.infer<typeof reasonSchema>;
export type DisputeStatus = z.infer<typeof disputeStatusSchema>;

export const REASON_LABELS: Record<DisputeReason, string> = {
  WEIGHT_MISMATCH: "Weight mismatch",
  QUALITY_MISMATCH: "Quality mismatch",
  NON_DELIVERY: "Non-delivery",
  OTHER: "Other",
};

export const triageReportSchema = z.object({
  recommendation: z.enum(["RESOLVED_RELEASE", "RESOLVED_REFUND"]),
  confidence: z.coerce.number(),
  rationale: z.string(),
  flags: z.array(z.string()),
  metrics: z.object({
    avg_ndvi: z.coerce.number(),
    avg_fungal_risk: z.coerce.number(),
    telemetry_entries: z.coerce.number(),
  }),
  evaluated_at: z.string(),
});
export type TriageReport = z.infer<typeof triageReportSchema>;

export const disputeSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  opened_by: z.string().uuid(),
  reason: reasonSchema,
  description: z.string(),
  status: disputeStatusSchema,
  resolution_note: z.string().nullable(),
  resolved_at: z.string().nullable(),
  created_at: z.string(),
  orders: z.object({ total_price: z.coerce.number() }).nullable(),
  ai_triage: triageReportSchema.nullable().optional(),
});
export type Dispute = z.infer<typeof disputeSchema>;

export const evidenceSchema = z.object({
  id: z.string().uuid(),
  dispute_id: z.string().uuid(),
  author_id: z.string().uuid(),
  body: z.string(),
  created_at: z.string(),
});
export type Evidence = z.infer<typeof evidenceSchema>;

export const eligibleOrderSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  total_price: z.coerce.number(),
});
export type EligibleOrder = z.infer<typeof eligibleOrderSchema>;

export const openDisputeInput = z.object({
  order_id: z.string().uuid("Choose an order"),
  reason: reasonSchema,
  description: z.string().trim().min(10, "Describe the problem (at least 10 characters)").max(2000),
});
export type OpenDisputeInput = z.infer<typeof openDisputeInput>;

export const resolveInput = z.object({
  outcome: z.enum(["RESOLVED_RELEASE", "RESOLVED_REFUND"]),
  note: z.string().trim().min(5, "A resolution note is required (at least 5 characters)").max(2000),
});
export type ResolveInput = z.infer<typeof resolveInput>;

export const isOpen = (d: Pick<Dispute, "status">) => d.status === "OPEN";

export const outcomeLabel = (s: DisputeStatus) =>
  s === "OPEN" ? "Open" : s === "RESOLVED_RELEASE" ? "Released to farmer" : "Refunded to buyer";

/** Open disputes first, then newest first. */
export const sortDisputes = (list: Dispute[]): Dispute[] =>
  [...list].sort((a, b) => Number(isOpen(b)) - Number(isOpen(a)) || b.created_at.localeCompare(a.created_at));
