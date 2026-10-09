// Data access for KYC/KYB identity and land title verifications.
import { supabase } from "@/lib/supabaseClient";
import {
  kycVerificationSchema,
  submitKycInputSchema,
  type KycVerification,
  type SubmitKycInput,
} from "./schemas";

export async function fetchKycQueue(status?: string): Promise<KycVerification[]> {
  const { data, error } = await supabase.rpc("get_kyc_queue", {
    p_status: status || null,
  });

  if (error) throw new Error(error.message || "Failed to fetch KYC verification queue.");
  return kycVerificationSchema.array().parse(data ?? []);
}

export async function fetchMyKyc(): Promise<KycVerification[]> {
  const { data, error } = await supabase
    .from("kyc_verifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Could not load your verification records.");
  return kycVerificationSchema.array().parse(data ?? []);
}

export async function submitKyc(input: SubmitKycInput): Promise<KycVerification> {
  const v = submitKycInputSchema.parse(input);
  const { data, error } = await supabase.rpc("submit_kyc_application", {
    p_full_name: v.full_name,
    p_document_type: v.document_type,
    p_document_number: v.document_number,
    p_issuing_authority: v.issuing_authority,
    p_document_url: v.document_url || null,
  });

  if (error) throw new Error(error.message || "Failed to submit verification document.");
  return kycVerificationSchema.parse(data);
}

export async function reviewKyc(
  id: string,
  decision: "APPROVED" | "REJECTED",
  notes?: string,
): Promise<KycVerification> {
  const { data, error } = await supabase.rpc("review_kyc_application", {
    p_verification_id: id,
    p_decision: decision,
    p_notes: notes || null,
  });

  if (error) throw new Error(error.message || "Failed to review verification application.");
  return kycVerificationSchema.parse(data);
}
