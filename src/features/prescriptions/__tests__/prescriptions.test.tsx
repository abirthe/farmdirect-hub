// Tests for precision prescriptions schemas, agronomy urgency formatters, and panel component.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  prescriptionSchema,
  formatPrescriptionUrgency,
  formatPrescriptionCategory,
  type Prescription,
} from "../schemas";

vi.mock("../api", () => ({
  fetchPrescriptionsByCycle: vi.fn(),
  generatePrescriptions: vi.fn(),
  updatePrescriptionStatus: vi.fn(),
}));
import * as api from "../api";
import { PrecisionPrescriptionPanel } from "../components/PrecisionPrescriptionPanel";

const mockPrescription: Prescription = {
  id: "00000000-0000-4000-8000-000000000001",
  crop_cycle_id: "00000000-0000-4000-8000-000000000002",
  farmer_id: "00000000-0000-4000-8000-000000000003",
  category: "IRRIGATION",
  urgency: "CRITICAL",
  action_title: "Emergency Root-Zone Deep Irrigation",
  dosage_instruction: "45 mm flood/drip soak in early morning",
  rationale: "Critical soil moisture depletion (32% detected). Crop wilting imminent.",
  target_date: "2026-10-10",
  status: "SCHEDULED",
  created_at: "2026-10-09T03:00:00Z",
};

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {ui}
    </QueryClientProvider>,
  );

describe("Prescription Schemas & Helpers", () => {
  it("formats urgency and category labels properly", () => {
    expect(formatPrescriptionUrgency("CRITICAL").label).toMatch(/Critical Immediate Action/i);
    expect(formatPrescriptionUrgency("ROUTINE").label).toMatch(/Routine Agronomy/i);
    expect(formatPrescriptionCategory("FERTILIZER_NPK").label).toBe("NPK Nutrients");
  });

  it("validates valid prescription schema", () => {
    const res = prescriptionSchema.safeParse(mockPrescription);
    expect(res.success).toBe(true);
  });
});

describe("PrecisionPrescriptionPanel Component", () => {
  it("renders empty state and allows running the engine", async () => {
    vi.mocked(api.fetchPrescriptionsByCycle).mockResolvedValue([]);
    vi.mocked(api.generatePrescriptions).mockResolvedValue([mockPrescription]);

    wrap(<PrecisionPrescriptionPanel cycleId="00000000-0000-4000-8000-000000000002" />);

    expect(await screen.findByText(/No prescriptions scheduled yet/i)).toBeInTheDocument();

    const runBtn = screen.getByRole("button", { name: /Run Precision Engine/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(api.generatePrescriptions).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000002");
    });
  });

  it("renders scheduled prescriptions with details and handles mark as applied", async () => {
    vi.mocked(api.fetchPrescriptionsByCycle).mockResolvedValue([mockPrescription]);
    vi.mocked(api.updatePrescriptionStatus).mockResolvedValue({
      ...mockPrescription,
      status: "APPLIED",
      applied_at: "2026-10-09T04:00:00Z",
    });

    wrap(<PrecisionPrescriptionPanel cycleId="00000000-0000-4000-8000-000000000002" />);

    expect(await screen.findByText(/Emergency Root-Zone Deep Irrigation/i)).toBeInTheDocument();
    expect(screen.getByText(/45 mm flood\/drip soak/i)).toBeInTheDocument();
    expect(screen.getByText(/Critical Immediate Action/i)).toBeInTheDocument();

    const applyBtn = screen.getByRole("button", { name: /Mark as Applied/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(api.updatePrescriptionStatus).toHaveBeenCalledWith(
        "00000000-0000-4000-8000-000000000001",
        "APPLIED",
      );
    });
  });
});
