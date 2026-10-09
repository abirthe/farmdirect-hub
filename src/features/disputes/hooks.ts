// React Query hooks for disputes; mutations also refresh audit data since every action is audited.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addEvidence, fetchDisputes, fetchEligibleOrders, fetchEvidence, openDispute, resolveDispute, triageDispute } from "./api";
import { auditKeys } from "@/features/audit/hooks";
import type { ResolveInput, TriageReport } from "./schemas";

export const disputeKeys = {
  all: ["disputes"] as const,
  list: () => [...disputeKeys.all, "list"] as const,
  evidence: () => [...disputeKeys.all, "evidence"] as const,
  eligible: () => [...disputeKeys.all, "eligible"] as const,
};

export const useDisputes = () => useQuery({ queryKey: disputeKeys.list(), queryFn: fetchDisputes });
export const useEvidence = () => useQuery({ queryKey: disputeKeys.evidence(), queryFn: fetchEvidence });
export const useEligibleOrders = () => useQuery({ queryKey: disputeKeys.eligible(), queryFn: fetchEligibleOrders });

function useDisputeMutation<V, R = void>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disputeKeys.all });
      qc.invalidateQueries({ queryKey: auditKeys.all });
    },
  });
}

export const useOpenDispute = () => useDisputeMutation(openDispute);
export const useAddEvidence = () => useDisputeMutation((v: { id: string; body: string }) => addEvidence(v.id, v.body));
export const useResolveDispute = () =>
  useDisputeMutation((v: { id: string; input: ResolveInput }) => resolveDispute(v.id, v.input));
export const useTriageDispute = () =>
  useDisputeMutation<string, TriageReport>((disputeId: string) => triageDispute(disputeId));
