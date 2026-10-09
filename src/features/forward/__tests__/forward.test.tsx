// Tests: capacity/value logic and both role views (happy path + empty/error).
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { contractValue, isPastDelivery, remainingCapacityTons, type CropCycleOption, type ForwardContract } from "../schemas";

vi.mock("../api", () => ({
  fetchContracts: vi.fn(), fetchMyCycles: vi.fn(), createContract: vi.fn(), acceptContract: vi.fn(), cancelContract: vi.fn(),
}));
import * as api from "../api";
import { BuyerForwardBoard } from "../components/BuyerForwardBoard";
import { FarmerForwardPanel } from "../components/FarmerForwardPanel";

const FARMER = "00000000-0000-4000-8000-0000000000f1";
const BUYER = "00000000-0000-4000-8000-0000000000b1";
const CYCLE = "00000000-0000-4000-8000-0000000000c1";
const cycle: CropCycleOption = { id: CYCLE, crop_type: "Boro Rice", status: "GROWING", ai_predicted_yield_kg: 10000 };
const fc = (o: Partial<ForwardContract> = {}): ForwardContract => ({
  id: "00000000-0000-4000-8000-0000000000d1", farmer_id: FARMER, crop_cycle_id: CYCLE, buyer_id: null,
  qty_tons: 4, price_per_ton: 500, delivery_date: "2999-01-01", status: "OFFERED", accepted_at: null,
  created_at: "2026-10-09T00:00:00Z", ...o,
});
const wrap = (ui: React.ReactNode) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

describe("forward logic", () => {
  it("subtracts offered and accepted, ignores cancelled", () => {
    const list = [fc(), fc({ id: "b", status: "ACCEPTED", qty_tons: 3 }), fc({ id: "c", status: "CANCELLED", qty_tons: 9 })];
    expect(remainingCapacityTons(cycle, list)).toBe(3);
    expect(remainingCapacityTons({ ...cycle, ai_predicted_yield_kg: null }, [])).toBe(0);
  });
  it("computes value and delivery expiry", () => {
    expect(contractValue(fc())).toBe(2000);
    expect(isPastDelivery(fc({ delivery_date: "2000-01-01" }))).toBe(true);
    expect(isPastDelivery(fc())).toBe(false);
  });
});

describe("FarmerForwardPanel", () => {
  it("lists my contracts and crop choices", async () => {
    vi.mocked(api.fetchContracts).mockResolvedValue([fc()]);
    vi.mocked(api.fetchMyCycles).mockResolvedValue([cycle]);
    wrap(<FarmerForwardPanel userId={FARMER} />);
    expect(await screen.findByText("OFFERED")).toBeTruthy();
    expect(await screen.findByText("Boro Rice")).toBeTruthy();
  });
  it("shows empty state", async () => {
    vi.mocked(api.fetchContracts).mockResolvedValue([]);
    vi.mocked(api.fetchMyCycles).mockResolvedValue([]);
    wrap(<FarmerForwardPanel userId={FARMER} />);
    expect(await screen.findByTestId("farmer-forward-empty")).toBeTruthy();
  });
});

describe("BuyerForwardBoard", () => {
  it("shows open offers with accept button", async () => {
    vi.mocked(api.fetchContracts).mockResolvedValue([fc()]);
    wrap(<BuyerForwardBoard userId={BUYER} />);
    expect(await screen.findByText("Accept")).toBeTruthy();
  });
  it("shows error state", async () => {
    vi.mocked(api.fetchContracts).mockRejectedValue(new Error("Could not load forward contracts."));
    wrap(<BuyerForwardBoard userId={BUYER} />);
    expect((await screen.findByRole("alert")).textContent).toMatch(/Could not load/);
  });
});
