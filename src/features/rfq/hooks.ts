// React Query hooks for RFQs; every mutation invalidates the rfq keys precisely.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { awardBid, cancelRfq, createRfq, fetchBids, fetchRfqs, submitBid, withdrawBid } from "./api";
import type { BidInput } from "./schemas";

export const rfqKeys = {
  all: ["rfq"] as const,
  list: () => [...rfqKeys.all, "list"] as const,
  bids: () => [...rfqKeys.all, "bids"] as const,
};

export const useRfqs = () => useQuery({ queryKey: rfqKeys.list(), queryFn: fetchRfqs });
export const useBids = () => useQuery({ queryKey: rfqKeys.bids(), queryFn: fetchBids });

function useRfqMutation<V>(fn: (v: V) => Promise<void>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: rfqKeys.all }) });
}

export const useCreateRfq = () => useRfqMutation(createRfq);
export const useSubmitBid = () => useRfqMutation((v: { rfqId: string; input: BidInput }) => submitBid(v.rfqId, v.input));
export const useWithdrawBid = () => useRfqMutation(withdrawBid);
export const useAwardBid = () => useRfqMutation(awardBid);
export const useCancelRfq = () => useRfqMutation(cancelRfq);
