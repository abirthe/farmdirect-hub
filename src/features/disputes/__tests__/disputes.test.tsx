// Tests: dispute logic, participant panel (happy/empty/validation) and admin resolve guard.
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isOpen, outcomeLabel, openDisputeInput, resolveInput, sortDisputes, triageReportSchema, type Dispute } from "../schemas";

vi.mock("../api", () => ({
  fetchDisputes: vi.fn(), fetchEvidence: vi.fn(), fetchEligibleOrders: vi.fn(),
  openDispute: vi.fn(), addEvidence: vi.fn(), resolveDispute: vi.fn(), triageDispute: vi.fn(),
}));
import * as api from "../api";
import { AdminDisputesPanel } from "../components/AdminDisputesPanel";
import { MyDisputesPanel } from "../components/MyDisputesPanel";

const dispute = (o: Partial<Dispute> = {}): Dispute => ({
  id: "00000000-0000-4000-8000-0000000000d1", order_id: "00000000-0000-4000-8000-0000000000a1",
  opened_by: "00000000-0000-4000-8000-0000000000b1", reason: "WEIGHT_MISMATCH",
  description: "Delivered 0.4t short of agreed weight", status: "OPEN", resolution_note: null, resolved_at: null,
  created_at: "2026-10-09T00:00:00Z", orders: { total_price: 3800 }, ...o,
});
const wrap = (ui: React.ReactNode) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

describe("dispute logic", () => {
  it("sorts open first then newest", () => {
    const list = [
      dispute({ id: "a", status: "RESOLVED_REFUND", resolved_at: "x", created_at: "2026-10-10T00:00:00Z" }),
      dispute({ id: "b", created_at: "2026-10-01T00:00:00Z" }),
      dispute({ id: "c", created_at: "2026-10-05T00:00:00Z" }),
    ];
    expect(sortDisputes(list).map((d) => d.id)).toEqual(["c", "b", "a"]);
    expect(isOpen(dispute())).toBe(true);
    expect(outcomeLabel("RESOLVED_REFUND")).toBe("Refunded to buyer");
  });
  it("validates inputs", () => {
    expect(openDisputeInput.safeParse({ order_id: "x", reason: "OTHER", description: "long enough text" }).success).toBe(false);
    expect(resolveInput.safeParse({ outcome: "RESOLVED_REFUND", note: "no" }).success).toBe(false);
    expect(resolveInput.safeParse({ outcome: "RESOLVED_REFUND", note: "Weight verified short" }).success).toBe(true);
  });
});

describe("MyDisputesPanel", () => {
  it("lists my disputes", async () => {
    vi.mocked(api.fetchDisputes).mockResolvedValue([dispute()]);
    vi.mocked(api.fetchEvidence).mockResolvedValue([]);
    vi.mocked(api.fetchEligibleOrders).mockResolvedValue([]);
    wrap(<MyDisputesPanel />);
    expect(await screen.findByText("Weight mismatch · order 00000000")).toBeTruthy();
  });
  it("shows empty state and blocks invalid submit", async () => {
    vi.mocked(api.fetchDisputes).mockResolvedValue([]);
    vi.mocked(api.fetchEvidence).mockResolvedValue([]);
    vi.mocked(api.fetchEligibleOrders).mockResolvedValue([]);
    wrap(<MyDisputesPanel />);
    expect(await screen.findByTestId("my-disputes-empty")).toBeTruthy();
    fireEvent.click(screen.getByText("Open dispute"));
    expect((await screen.findByRole("alert")).textContent).toMatch(/Choose an order/);
    expect(api.openDispute).not.toHaveBeenCalled();
  });
});

describe("AdminDisputesPanel", () => {
  it("requires a note before resolving", async () => {
    vi.mocked(api.fetchDisputes).mockResolvedValue([dispute()]);
    vi.mocked(api.fetchEvidence).mockResolvedValue([]);
    wrap(<AdminDisputesPanel />);
    fireEvent.click(await screen.findByText("Refund buyer"));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/note is required/));
    expect(api.resolveDispute).not.toHaveBeenCalled();
  });
  it("shows error state", async () => {
    vi.mocked(api.fetchDisputes).mockRejectedValue(new Error("Could not load disputes."));
    vi.mocked(api.fetchEvidence).mockResolvedValue([]);
    wrap(<AdminDisputesPanel />);
    expect((await screen.findByRole("alert")).textContent).toMatch(/Could not load/);
  });

  it("renders cached AI triage and triggers on-demand analysis", async () => {
    const triagedDispute = dispute({
      ai_triage: {
        recommendation: "RESOLVED_REFUND",
        confidence: 88.5,
        rationale: "High fungal stress detected",
        flags: ["ELEVATED_FUNGAL_RISK"],
        metrics: { avg_ndvi: 0.58, avg_fungal_risk: 0.45, telemetry_entries: 12 },
        evaluated_at: "2026-10-09T00:00:00Z",
      },
    });
    vi.mocked(api.fetchDisputes).mockResolvedValue([triagedDispute]);
    vi.mocked(api.fetchEvidence).mockResolvedValue([]);
    vi.mocked(api.triageDispute).mockResolvedValue({
      recommendation: "RESOLVED_RELEASE",
      confidence: 82,
      rationale: "Healthy telemetry",
      flags: ["VERIFIED_OPTIMAL_HARVEST"],
      metrics: { avg_ndvi: 0.8, avg_fungal_risk: 0.1, telemetry_entries: 15 },
      evaluated_at: "2026-10-09T00:00:00Z",
    });

    wrap(<AdminDisputesPanel />);
    expect(await screen.findByTestId("triage-report")).toBeTruthy();
    expect(screen.getByText("88.5% confidence")).toBeTruthy();

    fireEvent.click(screen.getByText("Run AI Telemetry Triage"));
    await waitFor(() => expect(api.triageDispute).toHaveBeenCalledWith(triagedDispute.id));
  });
});
