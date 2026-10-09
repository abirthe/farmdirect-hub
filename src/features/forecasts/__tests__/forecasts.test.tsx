// Tests for macroeconomic demand forecasts, shortage alerts, and DemandForecastPanel.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import {
  formatShortageRisk,
  formatDeficit,
  regionalForecastSchema,
  type RegionalForecast,
} from "../schemas";

vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    formatCurrency: (amount: number) => `$${amount.toLocaleString()}`,
    currency: "USD",
  }),
}));

vi.mock("../api", () => ({
  fetchRegionalForecasts: vi.fn(),
}));
import * as api from "../api";
import { DemandForecastPanel } from "../components/DemandForecastPanel";

const mockForecast: RegionalForecast = {
  id: "00000000-0000-4000-8000-000000000001",
  region: "Rajshahi",
  crop_type: "Boro Rice",
  forecast_month: "2026-11",
  projected_demand_tons: 14500,
  projected_supply_tons: 11200,
  deficit_surplus_tons: -3300,
  shortage_risk: "SEVERE",
  recommended_action: "Lock forward contracts immediately to hedge against 22% regional production deficit.",
  historical_price_benchmark_usd: 380,
  projected_price_benchmark_usd: 450,
  price_trend_pct: 18.42,
  confidence_score: 92.4,
  updated_at: "2026-10-09T03:00:00Z",
};

const wrap = (ui: React.ReactNode) =>
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {ui}
      </QueryClientProvider>
    </MemoryRouter>,
  );

describe("Demand Forecast Schemas & Helpers", () => {
  it("formats shortage risk severity correctly", () => {
    expect(formatShortageRisk("SEVERE").label).toMatch(/Critical Shortage/i);
    expect(formatShortageRisk("MODERATE").label).toMatch(/Supply Tightness/i);
    expect(formatShortageRisk("NONE").label).toMatch(/Surplus/i);
  });

  it("formats deficit vs surplus numbers", () => {
    const deficit = formatDeficit(-3300);
    expect(deficit.isDeficit).toBe(true);
    expect(deficit.formatted).toBe("-3,300 tons deficit");
    expect(deficit.colorClass).toBe("text-red-500");

    const surplus = formatDeficit(4400);
    expect(surplus.isDeficit).toBe(false);
    expect(surplus.formatted).toBe("+4,400 tons surplus");
    expect(surplus.colorClass).toBe("text-emerald-500");
  });

  it("validates valid regional forecast schema", () => {
    const res = regionalForecastSchema.safeParse(mockForecast);
    expect(res.success).toBe(true);
  });
});

describe("DemandForecastPanel Component", () => {
  it("renders macro KPI strip and forecast cards", async () => {
    vi.mocked(api.fetchRegionalForecasts).mockResolvedValue([mockForecast]);

    wrap(<DemandForecastPanel />);

    expect(await screen.findByText(/Rajshahi · Boro Rice/i)).toBeInTheDocument();
    expect(screen.getByText(/^Critical Shortage Alert$/i)).toBeInTheDocument();
    expect(screen.getByText(/-3,300 tons deficit/i)).toBeInTheDocument();
    expect(screen.getAllByText(/14,500/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Lock forward contracts immediately/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Post RFQ/i })).toHaveAttribute("href", "/rfq");
    expect(screen.getByRole("link", { name: /Explore Forwards/i })).toHaveAttribute("href", "/forward");
  });

  it("filters forecasts dynamically and renders empty state when no matches", async () => {
    vi.mocked(api.fetchRegionalForecasts).mockResolvedValue([]);

    wrap(<DemandForecastPanel />);

    expect(await screen.findByText(/No shortage forecasts match your search/i)).toBeInTheDocument();
  });
});
