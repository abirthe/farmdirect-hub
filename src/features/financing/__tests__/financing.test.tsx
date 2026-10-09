// Tests: financing risk logic, card rendering, and dossier dashboard states.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getParametricPayoutTrigger, underwritingPassportSchema, type UnderwritingPassport } from "../schemas";

vi.mock("../api", () => ({
  fetchUnderwritingPassports: vi.fn(),
  generateUnderwritingPassport: vi.fn(),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "00000000-0000-4000-8000-0000000000f1", user_metadata: { role: "farmer" } },
  }),
}));
vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    currency: "BDT",
    formatCurrency: (val: number) => `৳${val}`,
  }),
}));
vi.mock("@/features/forward/api", () => ({
  fetchMyCycles: vi.fn().mockResolvedValue([]),
  fetchContracts: vi.fn().mockResolvedValue([]),
}));
import * as api from "../api";
import { FinancingPassportCard } from "../components/FinancingPassportCard";
import FinancingPage from "@/pages/FinancingPage";

const mockPassport: UnderwritingPassport = {
  id: "00000000-0000-4000-8000-000000000001",
  farmer_id: "00000000-0000-4000-8000-0000000000f1",
  crop_cycle_id: "00000000-0000-4000-8000-0000000000c1",
  risk_tier: "AAA",
  credit_score: 815,
  max_eligible_credit: 250000,
  parametric_coverage: 400000,
  ndvi_stability_index: 0.942,
  weather_hazard_index: 0.125,
  passport_hash: "abcdef12345678901234567890abcdef12345678901234567890abcdef123456",
  metrics_snapshot: {
    crop_type: "Boro Rice",
    predicted_yield_kg: 10000,
    confidence_score: 92,
  },
  created_at: "2026-10-09T00:00:00Z",
};

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );

describe("Financing & Insurance Logic", () => {
  it("determines parametric payout triggers based on hazard index", () => {
    expect(getParametricPayoutTrigger(0.1)).toMatch(/Low Hazard/);
    expect(getParametricPayoutTrigger(0.3)).toMatch(/Moderate Hazard/);
    expect(getParametricPayoutTrigger(0.6)).toMatch(/Elevated Hazard/);
  });

  it("validates underwriting passport schema payload", () => {
    const parsed = underwritingPassportSchema.safeParse(mockPassport);
    expect(parsed.success).toBe(true);
  });
});

describe("FinancingPassportCard Component", () => {
  it("renders credit score, risk tier, and limits", () => {
    render(<FinancingPassportCard passport={mockPassport} />);
    expect(screen.getByText("Underwriting Grade: AAA")).toBeTruthy();
    expect(screen.getByText("815 / 850")).toBeTruthy();
    expect(screen.getByText("NDVI Stability Index")).toBeTruthy();
    expect(screen.getByText("Weather Hazard Factor")).toBeTruthy();
  });
});

describe("FinancingPage", () => {
  it("shows empty state when no dossiers exist", async () => {
    vi.mocked(api.fetchUnderwritingPassports).mockResolvedValue([]);
    wrap(<FinancingPage />);
    expect(await screen.findByTestId("financing-empty")).toBeTruthy();
  });

  it("renders existing passports when loaded", async () => {
    vi.mocked(api.fetchUnderwritingPassports).mockResolvedValue([mockPassport]);
    wrap(<FinancingPage />);
    expect(await screen.findByTestId("passport-card")).toBeTruthy();
  });
});
