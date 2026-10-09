// Zod schemas and presentation helpers for automated identity & land title verification (KYC/KYB).
import { z } from "zod";

export const documentTypeSchema = z.enum([
  "NATIONAL_ID",
  "LAND_TITLE",
  "TRADE_LICENSE",
  "ORGANIC_CERT",
]);
export type DocumentType = z.infer<typeof documentTypeSchema>;

export const kycStatusSchema = z.enum([
  "PENDING",
  "AUTO_VERIFIED",
  "MANUAL_REVIEW",
  "APPROVED",
  "REJECTED",
]);
export type KycStatus = z.infer<typeof kycStatusSchema>;

export const automatedChecksSchema = z.object({
  format_valid: z.boolean().default(false),
  duplicate_check_passed: z.boolean().default(true),
  watchlist_cleared: z.boolean().default(true),
  confidence_score: z.coerce.number().default(0),
  rule_flags: z.array(z.string()).default([]),
  analyzed_at: z.string().optional(),
});
export type AutomatedChecks = z.infer<typeof automatedChecksSchema>;

export const kycVerificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  full_name: z.string(),
  document_type: documentTypeSchema,
  document_number: z.string(),
  issuing_authority: z.string(),
  document_url: z.string().nullable().optional(),
  status: kycStatusSchema,
  automated_score: z.coerce.number(),
  automated_checks: automatedChecksSchema.or(z.record(z.any())),
  rejection_reason: z.string().nullable().optional(),
  reviewer_notes: z.string().nullable().optional(),
  verified_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type KycVerification = z.infer<typeof kycVerificationSchema>;

export const submitKycInputSchema = z.object({
  full_name: z.string().min(2, "Full legal name required"),
  document_type: documentTypeSchema,
  document_number: z.string().min(4, "Document number required"),
  issuing_authority: z.string().min(2, "Issuing authority required"),
  document_url: z.string().url("Must be a valid document URL").optional().or(z.literal("")),
});
export type SubmitKycInput = z.infer<typeof submitKycInputSchema>;

export function formatKycStatus(status: KycStatus): {
  label: string;
  badgeClass: string;
  isTerminal: boolean;
} {
  switch (status) {
    case "AUTO_VERIFIED":
      return {
        label: "AI Auto-Verified",
        badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
        isTerminal: true,
      };
    case "APPROVED":
      return {
        label: "Admin Approved",
        badgeClass: "bg-green-500/10 text-green-600 border-green-500/30",
        isTerminal: true,
      };
    case "MANUAL_REVIEW":
      return {
        label: "Manual Review Required",
        badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/30",
        isTerminal: false,
      };
    case "REJECTED":
      return {
        label: "Verification Rejected",
        badgeClass: "bg-red-500/10 text-red-600 border-red-500/30",
        isTerminal: true,
      };
    case "PENDING":
    default:
      return {
        label: "Pending Ingestion",
        badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/30",
        isTerminal: false,
      };
  }
}

export function formatDocumentType(type: DocumentType): string {
  switch (type) {
    case "NATIONAL_ID":
      return "National ID (NID)";
    case "LAND_TITLE":
      return "Land Title Deed / Khatian";
    case "TRADE_LICENSE":
      return "Corporate Trade License";
    case "ORGANIC_CERT":
      return "Organic / GAP Certificate";
  }
}
