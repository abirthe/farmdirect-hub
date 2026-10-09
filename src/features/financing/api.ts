// Data access for agricultural micro-financing and insurance underwriting passports.
import { supabase } from "@/lib/supabaseClient";
import { underwritingPassportSchema, type UnderwritingPassport } from "./schemas";

export async function fetchUnderwritingPassports(): Promise<UnderwritingPassport[]> {
  const { data, error } = await supabase
    .from("underwriting_passports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Could not load your underwriting passports.");
  }
  return underwritingPassportSchema.array().parse(data ?? []);
}

export async function generateUnderwritingPassport(cycleId: string): Promise<UnderwritingPassport> {
  const { data, error } = await supabase.rpc("generate_underwriting_passport", {
    p_cycle_id: cycleId,
  });

  if (error) {
    throw new Error(error.message || "Failed to generate underwriting passport for this crop cycle.");
  }
  return underwritingPassportSchema.parse(data);
}
