// Tests: pure filter logic, and the panel's data/empty states with a mocked api layer.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { filterAuditEntries, isCriticalAction, type AuditEntry } from "../schemas";

vi.mock("../api", () => ({
  fetchAuditLog: vi.fn(),
  verifyAuditChain: vi.fn(),
}));
import * as api from "../api";
import { AuditLogPanel } from "../components/AuditLogPanel";

const entry = (over: Partial<AuditEntry> = {}): AuditEntry => ({
  id: "00000000-0000-4000-8000-000000000001",
  actor_id: null,
  action: "ESCROW_FORCE_RELEASE",
  entity: "orders",
  entity_id: "00000000-0000-4000-8000-000000000002",
  details: {},
  created_at: "2026-10-09T00:00:00Z",
  row_hash: "abc",
  ...over,
});

const renderPanel = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AuditLogPanel />
    </QueryClientProvider>,
  );

describe("audit logic", () => {
  it("filters by action text and flags critical actions", () => {
    const list = [entry(), entry({ id: "x", action: "ORDER_CREATED" })];
    expect(filterAuditEntries(list, { search: "force" })).toHaveLength(1);
    expect(filterAuditEntries(list, { search: "" })).toHaveLength(2);
    expect(isCriticalAction("ESCROW_FORCE_RELEASE")).toBe(true);
    expect(isCriticalAction("ORDER_CREATED")).toBe(false);
  });
});

describe("AuditLogPanel", () => {
  it("renders entries and intact chain badge", async () => {
    vi.mocked(api.fetchAuditLog).mockResolvedValue([entry()]);
    vi.mocked(api.verifyAuditChain).mockResolvedValue({ ok: true, checked: 1, broken_id: null });
    renderPanel();
    expect(await screen.findByText("ESCROW_FORCE_RELEASE")).toBeTruthy();
    expect((await screen.findByTestId("audit-chain-status")).textContent).toContain("Chain intact");
  });

  it("shows empty state", async () => {
    vi.mocked(api.fetchAuditLog).mockResolvedValue([]);
    vi.mocked(api.verifyAuditChain).mockResolvedValue({ ok: true, checked: 0, broken_id: null });
    renderPanel();
    expect(await screen.findByTestId("audit-empty")).toBeTruthy();
  });
});
