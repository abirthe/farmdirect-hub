// Data access layer for precision agriculture prescriptions.
import { supabase } from "@/lib/supabaseClient";
import { prescriptionSchema, type Prescription } from "./schemas";

export async function fetchPrescriptionsByCycle(cycleId: string): Promise<Prescription[]> {
  const { data, error } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("crop_cycle_id", cycleId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Could not load agronomic prescriptions.");
  return prescriptionSchema.array().parse(data ?? []);
}

export async function generatePrescriptions(cycleId: string): Promise<Prescription[]> {
  const { data, error } = await supabase.rpc("generate_cycle_prescriptions", {
    p_cycle_id: cycleId,
  });

  if (error) throw new Error(error.message || "Failed to generate precision prescriptions.");
  return prescriptionSchema.array().parse(data ?? []);
}

export async function updatePrescriptionStatus(
  prescriptionId: string,
  status: "APPLIED" | "SKIPPED",
): Promise<Prescription> {
  const { data, error } = await supabase.rpc("mark_prescription_applied", {
    p_prescription_id: prescriptionId,
    p_status: status,
  });

  if (error) throw new Error(error.message || "Failed to update prescription status.");
  return prescriptionSchema.parse(data);
}
