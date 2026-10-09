// Data access layer for macroeconomic regional demand forecasts.
import { supabase } from "@/lib/supabaseClient";
import { regionalForecastSchema, type RegionalForecast } from "./schemas";

export async function fetchRegionalForecasts(filters?: {
  region?: string;
  cropType?: string;
}): Promise<RegionalForecast[]> {
  const { data, error } = await supabase.rpc("get_regional_forecasts", {
    p_region: filters?.region || null,
    p_crop_type: filters?.cropType || null,
  });

  if (error) throw new Error(error.message || "Could not fetch regional shortage forecasts.");
  return regionalForecastSchema.array().parse(data ?? []);
}
