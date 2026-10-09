// Tests: bid ranking/validation logic and both role views (happy path + empty).
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isRfqExpired, rankBids, validateBid, type Bid, type Rfq } from "../schemas";

vi.mock("../api", () => ({
  fetchRfqs: vi.fn(), fetchBids: vi.fn(), createRfq: vi.fn(), submitBid: vi.fn(),
  withdrawBid: vi.fn(), awardBid: vi.fn(), cancelRfq: vi.fn(),
}));
import * as api from "../api";
import { BuyerRfqPanel } from "../components/BuyerRfqPanel";
import { FarmerRfqBoard } from "../components/FarmerRfqBoard";

const BUYER = "00000000-0000-4000-8000-0000000000b1";
const FARMER = "00000000-0000-4000-8000-0000000000f1";
const rfq = (o: Partial<Rfq> = {}): Rfq => ({
  id: "00000000-0000-4000-8000-0000000000a1", buyer_id: BUYER, crop_type: "Boro Rice", qty_tons: 10,
  max_price_per_ton: 500, deadline: "2999-01-01T00:00:00Z", notes: null, status: "OPEN",
  awarded_bid_id: null, created_at: "2026-10-09T00:00:00Z", ...o,
});
const bid = (o: Partial<Bid> = {}): Bid => ({
  id: "00000000-0000-4000-8000-0000000000c1", rfq_id: rfq().id, farmer_id: FARMER, price_per_ton: 450,
  qty_tons: 5, note: null, status: "PENDING", created_at: "2026-10-09T00:00:00Z", ...o,
});
const wrap = (ui: React.ReactNode) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

describe("rfq logic", () => {
  it("ranks pending bids by price then quantity and drops non-pending", () => {
    const ranked = rankBids([
      bid({ id: "a", price_per_ton: 460 }), bid({ id: "b", price_per_ton: 440, qty_tons: 2 }),
      bid({ id: "c", price_per_ton: 440, qty_tons: 9 }), bid({ id: "d", status: "REJECTED" }),
    ]);
    expect(ranked.map((b) => b.id)).toEqual(["c", "b", "a"]);
  });
  it("validates bids against RFQ limits", () => {
    expect(validateBid(rfq(), { price_per_ton: 501, qty_tons: 1 })).toMatch(/Price/);
    expect(validateBid(rfq(), { price_per_ton: 400, qty_tons: 11 })).toMatch(/Quantity/);
    expect(validateBid(rfq(), { price_per_ton: 400, qty_tons: 10 })).toBeNull();
  });
  it("derives expiry from deadline", () => {
    expect(isRfqExpired(rfq({ deadline: "2000-01-01T00:00:00Z" }))).toBe(true);
    expect(isRfqExpired(rfq())).toBe(false);
  });
});

describe("BuyerRfqPanel", () => {
  it("shows my RFQ with the best bid", async () => {
    vi.mocked(api.fetchRfqs).mockResolvedValue([rfq()]);
    vi.mocked(api.fetchBids).mockResolvedValue([bid()]);
    wrap(<BuyerRfqPanel userId={BUYER} />);
    expect(await screen.findByText("Best")).toBeTruthy();
    expect(screen.getByText("Accept")).toBeTruthy();
  });
  it("shows empty state", async () => {
    vi.mocked(api.fetchRfqs).mockResolvedValue([]);
    vi.mocked(api.fetchBids).mockResolvedValue([]);
    wrap(<BuyerRfqPanel userId={BUYER} />);
    expect(await screen.findByTestId("buyer-rfq-empty")).toBeTruthy();
  });
});

describe("FarmerRfqBoard", () => {
  it("lists open RFQs with a bid form", async () => {
    vi.mocked(api.fetchRfqs).mockResolvedValue([rfq()]);
    vi.mocked(api.fetchBids).mockResolvedValue([]);
    wrap(<FarmerRfqBoard userId={FARMER} />);
    expect(await screen.findByLabelText("Your price per ton")).toBeTruthy();
  });
  it("shows empty state and error state", async () => {
    vi.mocked(api.fetchRfqs).mockResolvedValue([]);
    vi.mocked(api.fetchBids).mockResolvedValue([]);
    const { unmount } = wrap(<FarmerRfqBoard userId={FARMER} />);
    expect(await screen.findByTestId("farmer-rfq-empty")).toBeTruthy();
    unmount();
    vi.mocked(api.fetchRfqs).mockRejectedValue(new Error("Could not load requests."));
    wrap(<FarmerRfqBoard userId={FARMER} />);
    expect((await screen.findByRole("alert")).textContent).toMatch(/Could not load/);
  });
});
