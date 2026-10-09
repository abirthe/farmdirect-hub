// React Query hooks for precision agriculture prescriptions.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPrescriptionsByCycle,
  generatePrescriptions,
  updatePrescriptionStatus,
} from "./api";

const PRESCRIPTION_KEY = "prescriptions";

export function usePrescriptions(cycleId: string | undefined) {
  return useQuery({
    queryKey: [PRESCRIPTION_KEY, cycleId],
    queryFn: () => (cycleId ? fetchPrescriptionsByCycle(cycleId) : Promise.resolve([])),
    enabled: Boolean(cycleId),
  });
}

export function useGeneratePrescriptions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cycleId: string) => generatePrescriptions(cycleId),
    onSuccess: (_, cycleId) => {
      qc.invalidateQueries({ queryKey: [PRESCRIPTION_KEY, cycleId] });
    },
  });
}

export function useUpdatePrescriptionStatus(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APPLIED" | "SKIPPED" }) =>
      updatePrescriptionStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRESCRIPTION_KEY, cycleId] });
    },
  });
}
