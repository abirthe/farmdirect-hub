// Zod schemas and soil agronomy helpers for field IoT sensors.
import { z } from "zod";

export const deviceTypeSchema = z.enum(["SOIL_PROBE_NPK", "WEATHER_STATION", "LEAF_WETNESS_SENSOR"]);
export type DeviceType = z.infer<typeof deviceTypeSchema>;

export const sensorDeviceSchema = z.object({
  id: z.string().uuid(),
  crop_cycle_id: z.string().uuid(),
  device_serial: z.string(),
  device_type: deviceTypeSchema,
  battery_level: z.coerce.number(),
  last_ping: z.string().nullable(),
  status: z.enum(["ACTIVE", "OFFLINE", "CALIBRATING"]),
  created_at: z.string(),
});
export type SensorDevice = z.infer<typeof sensorDeviceSchema>;

export const telemetryLogSchema = z.object({
  id: z.string().uuid(),
  crop_cycle_id: z.string().uuid(),
  date_logged: z.string(),
  ndvi_score: z.coerce.number().nullable(),
  avg_temp_celsius: z.coerce.number().nullable(),
  rainfall_mm: z.coerce.number().nullable(),
  soil_moisture_percent: z.coerce.number().nullable(),
  fungal_risk_factor: z.coerce.number().nullable(),
  npk_nitrogen: z.coerce.number().nullable(),
  npk_phosphorus: z.coerce.number().nullable(),
  npk_potassium: z.coerce.number().nullable(),
  soil_ph: z.coerce.number().nullable(),
  source: z.string().default("SATELLITE"),
});
export type TelemetryLog = z.infer<typeof telemetryLogSchema>;

export const ingestInputSchema = z.object({
  crop_cycle_id: z.string().uuid("Invalid crop cycle ID"),
  device_serial: z.string().min(3, "Device serial required"),
  soil_moisture_percent: z.coerce.number().min(0).max(100),
  avg_temp_celsius: z.coerce.number().min(-10).max(60),
  rainfall_mm: z.coerce.number().min(0).max(500),
  npk_nitrogen: z.coerce.number().min(0).max(300),
  npk_phosphorus: z.coerce.number().min(0).max(300),
  npk_potassium: z.coerce.number().min(0).max(300),
  soil_ph: z.coerce.number().min(3).max(11),
});
export type IngestInput = z.infer<typeof ingestInputSchema>;

/** Agronomic NPK ratio evaluation. */
export function evaluateNpkHealth(n: number, p: number, k: number): {
  status: "OPTIMAL" | "DEFICIENT" | "EXCESS";
  advice: string;
} {
  if (n < 40 || p < 20 || k < 30) {
    return {
      status: "DEFICIENT",
      advice: "Soil nutrient depletion detected. Recommend top-dressing with nitrogen/urea or balanced NPK fertilizer.",
    };
  }
  if (n > 140 || p > 90 || k > 120) {
    return {
      status: "EXCESS",
      advice: "Elevated chemical nutrient concentration. Halt synthetic fertilizer application to avoid root burn.",
    };
  }
  return {
    status: "OPTIMAL",
    advice: "Nutrient balance is in optimal range for vegetative & grain-filling stages.",
  };
}
