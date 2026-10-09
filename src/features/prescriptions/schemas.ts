// Zod schemas and presentation helpers for precision agriculture prescriptions.
import { z } from "zod";

export const prescriptionCategorySchema = z.enum([
  "IRRIGATION",
  "FERTILIZER_NPK",
  "FUNGAL_PREVENTION",
  "HARVEST_PREP",
]);
export type PrescriptionCategory = z.infer<typeof prescriptionCategorySchema>;

export const prescriptionUrgencySchema = z.enum(["ROUTINE", "ATTENTION", "CRITICAL"]);
export type PrescriptionUrgency = z.infer<typeof prescriptionUrgencySchema>;

export const prescriptionStatusSchema = z.enum(["SCHEDULED", "APPLIED", "SKIPPED"]);
export type PrescriptionStatus = z.infer<typeof prescriptionStatusSchema>;

export const prescriptionSchema = z.object({
  id: z.string().uuid(),
  crop_cycle_id: z.string().uuid(),
  farmer_id: z.string().uuid(),
  category: prescriptionCategorySchema,
  urgency: prescriptionUrgencySchema,
  action_title: z.string().min(1),
  dosage_instruction: z.string().min(1),
  rationale: z.string().min(1),
  target_date: z.string(),
  status: prescriptionStatusSchema,
  applied_at: z.string().nullable().optional(),
  created_at: z.string(),
});
export type Prescription = z.infer<typeof prescriptionSchema>;

export function formatPrescriptionUrgency(urgency: PrescriptionUrgency): {
  label: string;
  badgeClass: string;
} {
  switch (urgency) {
    case "CRITICAL":
      return { label: "Critical Immediate Action", badgeClass: "bg-red-500/10 text-red-600 border-red-500/30" };
    case "ATTENTION":
      return { label: "High Priority Attention", badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/30" };
    case "ROUTINE":
    default:
      return { label: "Routine Agronomy Schedule", badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" };
  }
}

export function formatPrescriptionCategory(category: PrescriptionCategory): {
  label: string;
  iconName: "droplets" | "flask" | "shield" | "leaf";
} {
  switch (category) {
    case "IRRIGATION":
      return { label: "Micro-Irrigation", iconName: "droplets" };
    case "FERTILIZER_NPK":
      return { label: "NPK Nutrients", iconName: "flask" };
    case "FUNGAL_PREVENTION":
      return { label: "Pathogen Defense", iconName: "shield" };
    case "HARVEST_PREP":
      return { label: "Harvest Readiness", iconName: "leaf" };
  }
}
