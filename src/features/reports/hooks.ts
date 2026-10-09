// React Query hooks for commodity reports and regional index.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCommodityReports, fetchRegionalAggregatedIndex, downloadReport } from "./api";

const REPORTS_KEY = "commodity_reports";
const REGIONAL_INDEX_KEY = "regional_commodity_index";

export function useCommodityReports(tier?: string) {
  return useQuery({
    queryKey: [REPORTS_KEY, tier ?? ""],
    queryFn: () => fetchCommodityReports(tier),
  });
}

export function useRegionalAggregatedIndex(cropType?: string) {
  return useQuery({
    queryKey: [REGIONAL_INDEX_KEY, cropType ?? ""],
    queryFn: () => fetchRegionalAggregatedIndex(cropType),
  });
}

export function useDownloadReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => downloadReport(reportId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [REPORTS_KEY] });
    },
  });
}
