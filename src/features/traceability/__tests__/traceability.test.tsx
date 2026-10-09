// Tests: provenance logic, certificate rendering, and public trace verification states.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { calculateFreshnessScore, getTrustBadges, publicTraceSchema, type PublicTrace } from "../schemas";

vi.mock("../api", () => ({
  fetchPublicTrace: vi.fn(),
}));
import * as api from "../api";
import { TraceCertificate } from "../components/TraceCertificate";
import TraceabilityPage from "@/pages/TraceabilityPage";

const mockTrace: PublicTrace = {
  order_id: "00000000-0000-4000-8000-000000000001",
  batch_status: "DELIVERED",
  qr_delivery_hash: "a1b2c3d4e5f6789012345678",
  crop_type: "Boro Rice",
  quality_grade: "Premium Grade A",
  quantity_tons: 15.5,
  sown_date: "2026-01-15",
  harvest_date: "2026-05-20",
  delivered_at: "2026-05-22T10:00:00Z",
  farm: {
    name: "Shonar Bangla Agro",
    location: "Jessore District, Khulna",
    hectares: 4.5,
    farmer_name: "Rafiqul Islam",
  },
  environmental: {
    avg_ndvi: 0.82,
    rainfall_mm: 180.5,
    telemetry_points: 24,
    carbon_offset_kg: 658.8,
  },
};

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );

describe("Traceability Provenance Logic", () => {
  it("calculates freshness score based on harvest date", () => {
    const today = new Date().toISOString();
    const fresh = calculateFreshnessScore(today);
    expect(fresh.score).toBeGreaterThanOrEqual(92);

    const oldHarvest = calculateFreshnessScore("2020-01-01");
    expect(oldHarvest.score).toBe(75);
  });

  it("generates correct trust badges based on telemetry & delivery status", () => {
    const badges = getTrustBadges(mockTrace);
    expect(badges).toContain("Satellite-Verified Health");
    expect(badges).toContain("Cryptographic Proof of Delivery");
  });

  it("validates valid public trace schema payload", () => {
    const parsed = publicTraceSchema.safeParse(mockTrace);
    expect(parsed.success).toBe(true);
  });
});

describe("TraceCertificate Component", () => {
  it("renders farm name, crop type, and carbon offset", () => {
    render(<TraceCertificate trace={mockTrace} />);
    expect(screen.getByText("Boro Rice (Premium Grade A)")).toBeTruthy();
    expect(screen.getByText("Shonar Bangla Agro · Jessore District, Khulna")).toBeTruthy();
    expect(screen.getByText("-658.8 kg")).toBeTruthy();
    expect(screen.getByText("Rafiqul Islam")).toBeTruthy();
  });
});

describe("TraceabilityPage", () => {
  it("renders certificate when batch is found", async () => {
    vi.mocked(api.fetchPublicTrace).mockResolvedValue(mockTrace);
    wrap(<TraceabilityPage />);
    expect(await screen.findByTestId("trace-certificate")).toBeTruthy();
  });

  it("renders error alert when batch is invalid", async () => {
    vi.mocked(api.fetchPublicTrace).mockRejectedValue(new Error("Unable to locate batch traceability certificate."));
    wrap(<TraceabilityPage />);
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("Provenance Verification Failed")).toBeTruthy();
  });
});
