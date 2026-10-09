// React Query hooks for forward contracts.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptContract, cancelContract, createContract, fetchContracts, fetchMyCycles } from "./api";

export const forwardKeys = {
  all: ["forward"] as const,
  list: () => [...forwardKeys.all, "list"] as const,
  cycles: (userId: string) => [...forwardKeys.all, "cycles", userId] as const,
};

export const useContracts = () => useQuery({ queryKey: forwardKeys.list(), queryFn: fetchContracts });
export const useMyCycles = (userId: string) =>
  useQuery({ queryKey: forwardKeys.cycles(userId), queryFn: () => fetchMyCycles(userId) });

function useForwardMutation<V>(fn: (v: V) => Promise<void>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: forwardKeys.all }) });
}

export const useCreateContract = () => useForwardMutation(createContract);
export const useAcceptContract = () => useForwardMutation(acceptContract);
export const useCancelContract = () => useForwardMutation(cancelContract);
