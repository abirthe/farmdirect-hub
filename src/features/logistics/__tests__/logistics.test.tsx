// Tests: 3PL logistics formatters, schema validation, and tracker component states.
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { formatLogisticsStatus, shipmentSchema, type Shipment } from "../schemas";

vi.mock("../api", () => ({
  fetchShipmentByOrder: vi.fn(),
  dispatchShipment: vi.fn(),
  updateShipmentTelemetry: vi.fn(),
}));
import * as api from "../api";
import { LogisticsTracker } from "../components/LogisticsTracker";

const mockShipment: Shipment = {
  id: "00000000-0000-4000-8000-000000000001",
  order_id: "00000000-0000-4000-8000-000000000002",
  carrier_name: "RedX Agro Freight",
  tracking_number: "AGRO-3PL-98FA2B",
  driver_name: "Kabir Hossain",
  vehicle_plate: "DHAKA-METRO-44",
  status: "IN_TRANSIT",
  current_lat: 23.2145,
  current_lng: 89.3211,
  waypoints: [
    {
      lat: 23.1667,
      lng: 89.2167,
      status: "IN_TRANSIT",
      note: "Freight picked up at farm depot",
      recorded_at: "2026-10-09T02:00:00Z",
    },
  ],
  created_at: "2026-10-09T02:00:00Z",
  updated_at: "2026-10-09T02:00:00Z",
};

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {ui}
    </QueryClientProvider>,
  );

describe("Logistics Logic & Schemas", () => {
  it("formats statuses with clear labels and colors", () => {
    expect(formatLogisticsStatus("PENDING_PICKUP").label).toMatch(/Awaiting Pickup/);
    expect(formatLogisticsStatus("IN_TRANSIT").label).toMatch(/Freight in Transit/);
    expect(formatLogisticsStatus("DELIVERED").label).toMatch(/Completed/);
  });

  it("validates valid shipment schema payload", () => {
    const parsed = shipmentSchema.safeParse(mockShipment);
    expect(parsed.success).toBe(true);
  });
});

describe("LogisticsTracker Component", () => {
  it("renders dispatch form when no carrier is assigned and user is farmer", async () => {
    vi.mocked(api.fetchShipmentByOrder).mockResolvedValue(null);
    wrap(<LogisticsTracker orderId="00000000-0000-4000-8000-000000000002" isFarmerOrAdmin={true} />);
    expect(await screen.findByText("Dispatch 3PL Freight")).toBeTruthy();
    expect(screen.getByLabelText("Select 3PL Carrier")).toBeTruthy();
  });

  it("renders active tracking, tracking number, and waypoints when shipment exists", async () => {
    vi.mocked(api.fetchShipmentByOrder).mockResolvedValue(mockShipment);
    wrap(<LogisticsTracker orderId="00000000-0000-4000-8000-000000000002" isFarmerOrAdmin={true} />);
    expect(await screen.findByText("AGRO-3PL-98FA2B")).toBeTruthy();
    expect(screen.getByText("RedX Agro Freight")).toBeTruthy();
    expect(screen.getByText("Freight picked up at farm depot")).toBeTruthy();
    expect(screen.getByText("Simulate GPS Telemetry Ping")).toBeTruthy();

    fireEvent.click(screen.getByText("Simulate GPS Telemetry Ping"));
    await waitFor(() => expect(api.updateShipmentTelemetry).toHaveBeenCalled());
  });
});
