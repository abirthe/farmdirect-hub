// Tests for automated identity & land title verification (KYC/KYB rule engine).
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  formatKycStatus,
  formatDocumentType,
  kycVerificationSchema,
  submitKycInputSchema,
  type KycVerification,
} from "../schemas";

vi.mock("../api", () => ({
  fetchKycQueue: vi.fn(),
  fetchMyKyc: vi.fn(),
  submitKyc: vi.fn(),
  reviewKyc: vi.fn(),
}));
import * as api from "../api";
import { AdminKycQueue } from "../components/AdminKycQueue";

const mockKyc: KycVerification = {
  id: "00000000-0000-4000-8000-000000000001",
  user_id: "00000000-0000-4000-8000-000000000002",
  full_name: "Mizanur Rahman",
  document_type: "LAND_TITLE",
  document_number: "KH-984210",
  issuing_authority: "Ministry of Land, Jessore",
  document_url: null,
  status: "MANUAL_REVIEW",
  automated_score: 70,
  automated_checks: {
    format_valid: true,
    duplicate_check_passed: true,
    watchlist_cleared: true,
    confidence_score: 70,
    rule_flags: ["Requires cadastral mouza manual surveyor check"],
  },
  rejection_reason: null,
  reviewer_notes: null,
  verified_at: null,
  created_at: "2026-10-09T03:00:00Z",
  updated_at: "2026-10-09T03:00:00Z",
};

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {ui}
    </QueryClientProvider>,
  );

describe("KYC Schemas & Helpers", () => {
  it("formats KYC status with terminal flags", () => {
    expect(formatKycStatus("AUTO_VERIFIED").label).toMatch(/Auto-Verified/i);
    expect(formatKycStatus("AUTO_VERIFIED").isTerminal).toBe(true);

    expect(formatKycStatus("MANUAL_REVIEW").label).toMatch(/Manual Review/i);
    expect(formatKycStatus("MANUAL_REVIEW").isTerminal).toBe(false);

    expect(formatKycStatus("REJECTED").isTerminal).toBe(true);
  });

  it("formats document types correctly", () => {
    expect(formatDocumentType("NATIONAL_ID")).toBe("National ID (NID)");
    expect(formatDocumentType("LAND_TITLE")).toBe("Land Title Deed / Khatian");
  });

  it("validates valid KYC verification payload", () => {
    const res = kycVerificationSchema.safeParse(mockKyc);
    expect(res.success).toBe(true);
  });

  it("validates submission input schemas", () => {
    const valid = submitKycInputSchema.safeParse({
      full_name: "Tariqul Islam",
      document_type: "NATIONAL_ID",
      document_number: "1982736450",
      issuing_authority: "Election Commission",
    });
    expect(valid.success).toBe(true);

    const invalid = submitKycInputSchema.safeParse({
      full_name: "T",
      document_type: "NATIONAL_ID",
      document_number: "12",
      issuing_authority: "",
    });
    expect(invalid.success).toBe(false);
  });
});

describe("AdminKycQueue Component", () => {
  it("renders credential queue with AI diagnostics and handles approval", async () => {
    vi.mocked(api.fetchKycQueue).mockResolvedValue([mockKyc]);
    vi.mocked(api.reviewKyc).mockResolvedValue({
      ...mockKyc,
      status: "APPROVED",
      verified_at: "2026-10-09T04:00:00Z",
    });

    wrap(<AdminKycQueue />);

    expect(await screen.findByText(/Mizanur Rahman/i)).toBeInTheDocument();
    expect(screen.getByText(/KH-984210/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Confidence: 70%/i)).toBeInTheDocument();
    expect(screen.getByText(/Manual Review Required/i)).toBeInTheDocument();
    expect(screen.getByText(/Requires cadastral mouza manual surveyor check/i)).toBeInTheDocument();

    const approveBtn = screen.getByRole("button", { name: /Approve/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(api.reviewKyc).toHaveBeenCalledWith(
        "00000000-0000-4000-8000-000000000001",
        "APPROVED",
        undefined,
      );
    });
  });

  it("renders empty state when queue is empty", async () => {
    vi.mocked(api.fetchKycQueue).mockResolvedValue([]);

    wrap(<AdminKycQueue />);

    expect(await screen.findByText(/No verification credentials found/i)).toBeInTheDocument();
  });
});
