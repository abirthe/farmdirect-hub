// React Query hooks for automated KYC verifications.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchKycQueue, fetchMyKyc, submitKyc, reviewKyc } from "./api";
import type { SubmitKycInput } from "./schemas";

const KYC_QUEUE_KEY = "kyc_queue";
const MY_KYC_KEY = "my_kyc";

export function useKycQueue(status?: string) {
  return useQuery({
    queryKey: [KYC_QUEUE_KEY, status ?? ""],
    queryFn: () => fetchKycQueue(status),
  });
}

export function useMyKyc() {
  return useQuery({
    queryKey: [MY_KYC_KEY],
    queryFn: () => fetchMyKyc(),
  });
}

export function useSubmitKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitKycInput) => submitKyc(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MY_KYC_KEY] });
      qc.invalidateQueries({ queryKey: [KYC_QUEUE_KEY] });
    },
  });
}

export function useReviewKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, notes }: { id: string; decision: "APPROVED" | "REJECTED"; notes?: string }) =>
      reviewKyc(id, decision, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KYC_QUEUE_KEY] });
    },
  });
}
