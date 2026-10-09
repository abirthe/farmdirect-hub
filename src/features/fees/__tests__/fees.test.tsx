// Tests: pure fee math/validation and FeeTiersPanel render + validation error.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { estimateFee, estimateFeeBps, validateTiers } from "../schemas";

vi.mock("../api", () => ({ fetchFeeTiers: vi.fn(), saveFeeTiers: vi.fn() }));
import * as api from "../api";
import { FeeTiersPanel } from "../components/FeeTiersPanel";

const tiers = [
  { min_order_total: 0, rate_bps: 300 },
  { min_order_total: 100000, rate_bps: 250 },
  { min_order_total: 500000, rate_bps: 200 },
];

const renderPanel = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <FeeTiersPanel />
    </QueryClientProvider>,
  );

describe("fee logic", () => {
  it("picks the highest matching tier", () => {
    expect(estimateFeeBps(tiers, 50)).toBe(300);
    expect(estimateFeeBps(tiers, 100000)).toBe(250);
    expect(estimateFeeBps(tiers, 900000)).toBe(200);
  });
  it("computes fee rounded to 2 decimals", () => {
    expect(estimateFee(tiers, 3800)).toBe(114);
    expect(estimateFee(tiers, 100000)).toBe(2500);
  });
  it("validates tier sets", () => {
    expect(validateTiers([])).toMatch(/at least one/);
    expect(validateTiers([{ min_order_total: 5, rate_bps: 100 }])).toMatch(/starting at 0/);
    expect(validateTiers([tiers[0], tiers[0]])).toMatch(/unique/);
    expect(validateTiers(tiers)).toBeNull();
  });
});

describe("FeeTiersPanel", () => {
  it("renders loaded tiers with save enabled", async () => {
    vi.mocked(api.fetchFeeTiers).mockResolvedValue(tiers);
    renderPanel();
    expect(await screen.findByLabelText("Tier 2 fee percent")).toBeTruthy();
    expect((screen.getByText("Save tiers") as HTMLButtonElement).disabled).toBe(false);
  });
  it("shows empty state and validation error", async () => {
    vi.mocked(api.fetchFeeTiers).mockResolvedValue([]);
    renderPanel();
    expect(await screen.findByTestId("fee-empty")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toMatch(/at least one/);
  });
});
