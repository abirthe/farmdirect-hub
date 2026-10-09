// Data access layer for aggregated commodity reports and regional indices.
import { supabase } from "@/lib/supabaseClient";
import {
  commodityReportSchema,
  regionalIndexItemSchema,
  type CommodityReport,
  type RegionalIndexItem,
} from "./schemas";

export async function fetchCommodityReports(tier?: string): Promise<CommodityReport[]> {
  let query = supabase.from("commodity_reports").select("*").order("created_at", { ascending: false });

  if (tier) {
    query = query.eq("tier", tier);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message || "Failed to load commodity reports.");
  return commodityReportSchema.array().parse(data ?? []);
}

export async function fetchRegionalAggregatedIndex(cropType?: string): Promise<RegionalIndexItem[]> {
  const { data, error } = await supabase.rpc("get_regional_commodity_index", {
    p_crop_type: cropType || null,
  });

  if (error) throw new Error(error.message || "Failed to fetch regional aggregated index.");
  return regionalIndexItemSchema.array().parse(data ?? []);
}

export async function downloadReport(reportId: string): Promise<CommodityReport> {
  const { data, error } = await supabase.rpc("download_commodity_report", {
    p_report_id: reportId,
  });

  if (error) throw new Error(error.message || "Failed to download commodity report.");
  return commodityReportSchema.parse(data);
}
