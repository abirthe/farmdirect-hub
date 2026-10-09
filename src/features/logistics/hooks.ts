// React Query hooks for 3PL logistics tracking.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dispatchShipment, fetchShipmentByOrder, updateShipmentTelemetry } from "./api";
import { auditKeys } from "@/features/audit/hooks";
import type { DispatchInput } from "./schemas";

export const logisticsKeys = {
  all: ["logistics"] as const,
  order: (orderId: string) => [...logisticsKeys.all, "order", orderId] as const,
};

export const useShipment = (orderId: string) =>
  useQuery({
    queryKey: logisticsKeys.order(orderId),
    queryFn: () => fetchShipmentByOrder(orderId),
    enabled: Boolean(orderId),
  });

export function useDispatchShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DispatchInput) => dispatchShipment(input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: logisticsKeys.order(data.order_id) });
      qc.invalidateQueries({ queryKey: auditKeys.all });
    },
  });
}

export function useUpdateShipmentTelemetry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { shipmentId: string; lat: number; lng: number; status?: string; note?: string }) =>
      updateShipmentTelemetry(v.shipmentId, v.lat, v.lng, v.status, v.note),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: logisticsKeys.order(data.order_id) });
    },
  });
}
