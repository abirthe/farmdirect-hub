// React Query hooks for financing underwriting passports.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUnderwritingPassports, generateUnderwritingPassport } from "./api";
import { auditKeys } from "@/features/audit/hooks";

export const financingKeys = {
  all: ["financing"] as const,
  passports: () => [...financingKeys.all, "passports"] as const,
};

export const useUnderwritingPassports = () =>
  useQuery({
    queryKey: financingKeys.passports(),
    queryFn: fetchUnderwritingPassports,
  });

export function useGeneratePassport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cycleId: string) => generateUnderwritingPassport(cycleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financingKeys.all });
      qc.invalidateQueries({ queryKey: auditKeys.all });
    },
  });
}
