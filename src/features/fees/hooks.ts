// React Query hooks for fee tiers.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchFeeTiers, saveFeeTiers } from "./api";
import { auditKeys } from "@/features/audit/hooks";

export const feeKeys = { all: ["fees"] as const, tiers: () => [...feeKeys.all, "tiers"] as const };

export const useFeeTiers = () => useQuery({ queryKey: feeKeys.tiers(), queryFn: fetchFeeTiers });

export function useSaveFeeTiers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveFeeTiers,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: feeKeys.tiers() });
      qc.invalidateQueries({ queryKey: auditKeys.all }); // the change is itself audited
    },
  });
}
