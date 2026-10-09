// Data access for IoT sensor hardware devices and telemetry logs.
import { supabase } from "@/lib/supabaseClient";
import {
  sensorDeviceSchema, telemetryLogSchema, ingestInputSchema,
  type SensorDevice, type TelemetryLog, type IngestInput, type DeviceType,
} from "./schemas";

export async function fetchDevicesByCycle(cycleId: string): Promise<SensorDevice[]> {
  const { data, error } = await supabase
    .from("sensor_devices")
    .select("*")
    .eq("crop_cycle_id", cycleId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Could not load sensor devices.");
  return sensorDeviceSchema.array().parse(data ?? []);
}

export async function fetchTelemetryByCycle(cycleId: string): Promise<TelemetryLog[]> {
  const { data, error } = await supabase
    .from("telemetry_logs")
    .select("*")
    .eq("crop_cycle_id", cycleId)
    .order("date_logged", { ascending: false })
    .limit(30);

  if (error) throw new Error("Could not load telemetry logs.");
  return telemetryLogSchema.array().parse(data ?? []);
}

export async function registerSensorDevice(cycleId: string, serial: string, type: DeviceType): Promise<SensorDevice> {
  const { data, error } = await supabase.rpc("register_sensor_device", {
    p_cycle_id: cycleId,
    p_device_serial: serial,
    p_device_type: type,
  });

  if (error) throw new Error(error.message || "Failed to register sensor device.");
  return sensorDeviceSchema.parse(data);
}

export async function ingestTelemetry(input: IngestInput): Promise<TelemetryLog> {
  const v = ingestInputSchema.parse(input);
  const { data, error } = await supabase.rpc("ingest_sensor_telemetry", {
    p_cycle_id: v.crop_cycle_id,
    p_device_serial: v.device_serial,
    p_moisture: v.soil_moisture_percent,
    p_temp: v.avg_temp_celsius,
    p_rain: v.rainfall_mm,
    p_n: v.npk_nitrogen,
    p_p: v.npk_phosphorus,
    p_k: v.npk_potassium,
    p_ph: v.soil_ph,
  });

  if (error) throw new Error(error.message || "Failed to ingest sensor telemetry.");
  return telemetryLogSchema.parse(data);
}
