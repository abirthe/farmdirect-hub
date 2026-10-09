// Tests for Data Monetization, Commodity Reports, and Regional Index Aggregation.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  formatReportType,
  formatAccessTier,
  commodityReportSchema,
  regionalIndexItemSchema,
  type CommodityReport,
  type RegionalIndexItem,
} from "../schemas";

vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    formatCurrency: (amount: number) => `$${amount.toLocaleString()}`,
    currency: "USD",
  }),
}));

vi.mock("../api", () => ({
  fetchCommodityReports: vi.fn(),
  fetchRegionalAggregatedIndex: vi.fn(),
  downloadReport: vi.fn(),
}));
import * as api from "../api";
import { CommodityReportsPanel } from "../components/CommodityReportsPanel";

const mockReport: CommodityReport = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "Bangladesh National Boro Rice Pre-Harvest Index 2026",
  report_type: "YIELD_BENCHMARK",
  period: "2026-Q3",
  regions: ["Rajshahi", "Rangpur"],
  summary: "Comprehensive regional synthesis of satellite NDVI canopy vigor and yield trajectories.",
  tier: "GOVERNMENT_INSTITUTIONAL",
  price_usd: 1450,
  metrics: {
    total_sample_hectares: 24800,
    mean_ndvi: 0.82,
    avg_yield_tons_ha: 6.84,
    projected_gross_tons: 169632,
    historical_variance_pct: 5.4,
    participating_farms: 412,
  },
  download_count: 18,
  created_at: "2026-10-09T03:00:00Z",
};

const mockIndex: RegionalIndexItem = {
  region: "Rajshahi Cluster",
  crop_type: "Boro Rice",
  active_cycles_count: 12,
  total_hectares: 340,
  mean_ndvi_score: 0.81,
  projected_volume_tons: 2325,
};

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {ui}
    </QueryClientProvider>,
  );

describe("Commodity Reports Schemas & Helpers", () => {
  it("formats report types and tiers properly", () => {
    expect(formatReportType("YIELD_BENCHMARK").label).toMatch(/Yield Trajectory/i);
    expect(formatReportType("CLIMATE_IMPACT").label).toMatch(/Climate/i);
    expect(formatAccessTier("GOVERNMENT_INSTITUTIONAL").label).toMatch(/Institutional/i);
    expect(formatAccessTier("PUBLIC_SUMMARY").label).toMatch(/Public Summary/i);
  });

  it("validates valid commodity report schema", () => {
    const res = commodityReportSchema.safeParse(mockReport);
    expect(res.success).toBe(true);
  });

  it("validates regional index schema", () => {
    const res = regionalIndexItemSchema.safeParse(mockIndex);
    expect(res.success).toBe(true);
  });
});

describe("CommodityReportsPanel Component", () => {
  it("renders live regional index and intelligence report catalog", async () => {
    vi.mocked(api.fetchCommodityReports).mockResolvedValue([mockReport]);
    vi.mocked(api.fetchRegionalAggregatedIndex).mockResolvedValue([mockIndex]);

    wrap(<CommodityReportsPanel />);

    expect(await screen.findByText(/Bangladesh National Boro Rice Pre-Harvest Index 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Rajshahi Cluster/i)).toBeInTheDocument();
    expect(screen.getByText(/340 ha/i)).toBeInTheDocument();
    expect(screen.getByText(/2325 tons/i)).toBeInTheDocument();
    expect(screen.getByText(/Institutional \/ Gov/i)).toBeInTheDocument();
  });

  it("triggers report download on export button click", async () => {
    vi.mocked(api.fetchCommodityReports).mockResolvedValue([mockReport]);
    vi.mocked(api.fetchRegionalAggregatedIndex).mockResolvedValue([]);
    vi.mocked(api.downloadReport).mockResolvedValue(mockReport);

    wrap(<CommodityReportsPanel />);

    expect(await screen.findByText(/Bangladesh National Boro Rice Pre-Harvest Index 2026/i)).toBeInTheDocument();

    const exportBtn = screen.getByRole("button", { name: /Export Data Bundle/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(api.downloadReport).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001");
    });
  });

  it("renders empty state when no reports match", async () => {
    vi.mocked(api.fetchCommodityReports).mockResolvedValue([]);
    vi.mocked(api.fetchRegionalAggregatedIndex).mockResolvedValue([]);

    wrap(<CommodityReportsPanel />);

    expect(await screen.findByText(/No reports found matching criteria/i)).toBeInTheDocument();
  });
});
