// React Query hooks for macroeconomic demand forecasts.
import { useQuery } from "@tanstack/react-query";
import { fetchRegionalForecasts } from "./api";

const FORECASTS_KEY = "regional_forecasts";

export function useRegionalForecasts(filters?: { region?: string; cropType?: string }) {
  return useQuery({
    queryKey: [FORECASTS_KEY, filters?.region ?? "", filters?.cropType ?? ""],
    queryFn: () => fetchRegionalForecasts(filters),
  });
}
