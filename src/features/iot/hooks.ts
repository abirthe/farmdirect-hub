// React Query hooks for IoT sensor devices and telemetry.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDevicesByCycle, fetchTelemetryByCycle, ingestTelemetry, registerSensorDevice } from "./api";
import { auditKeys } from "@/features/audit/hooks";
import type { DeviceType, IngestInput } from "./schemas";

export const iotKeys = {
  all: ["iot"] as const,
  devices: (cycleId: string) => [...iotKeys.all, "devices", cycleId] as const,
  telemetry: (cycleId: string) => [...iotKeys.all, "telemetry", cycleId] as const,
};

export const useSensorDevices = (cycleId: string) =>
  useQuery({
    queryKey: iotKeys.devices(cycleId),
    queryFn: () => fetchDevicesByCycle(cycleId),
    enabled: Boolean(cycleId),
  });

export const useTelemetryLogs = (cycleId: string) =>
  useQuery({
    queryKey: iotKeys.telemetry(cycleId),
    queryFn: () => fetchTelemetryByCycle(cycleId),
    enabled: Boolean(cycleId),
  });

export function useRegisterDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { cycleId: string; serial: string; type: DeviceType }) =>
      registerSensorDevice(v.cycleId, v.serial, v.type),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: iotKeys.devices(data.crop_cycle_id) });
      qc.invalidateQueries({ queryKey: auditKeys.all });
    },
  });
}

export function useIngestTelemetry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: IngestInput) => ingestTelemetry(input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: iotKeys.telemetry(data.crop_cycle_id) });
      qc.invalidateQueries({ queryKey: iotKeys.devices(data.crop_cycle_id) });
    },
  });
}
