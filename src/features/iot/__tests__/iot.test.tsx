// Tests: IoT sensor schemas, NPK agronomy analysis, and IoTTelemetryPanel rendering.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  evaluateNpkHealth,
  sensorDeviceSchema,
  ingestInputSchema,
  type SensorDevice,
  type TelemetryLog,
} from "../schemas";

vi.mock("../api", () => ({
  fetchDevicesByCycle: vi.fn(),
  fetchTelemetryByCycle: vi.fn(),
  registerSensorDevice: vi.fn(),
  ingestTelemetry: vi.fn(),
}));
import * as api from "../api";
import { IoTTelemetryPanel } from "../components/IoTTelemetryPanel";

const mockDevice: SensorDevice = {
  id: "00000000-0000-4000-8000-000000000001",
  crop_cycle_id: "00000000-0000-4000-8000-000000000002",
  device_serial: "PROBE-NPK-8821",
  device_type: "SOIL_PROBE_NPK",
  battery_level: 94,
  last_ping: "2026-10-09T03:00:00Z",
  status: "ACTIVE",
  created_at: "2026-10-09T01:00:00Z",
};

const mockTelemetry: TelemetryLog = {
  id: "00000000-0000-4000-8000-000000000003",
  crop_cycle_id: "00000000-0000-4000-8000-000000000002",
  date_logged: "2026-10-09T03:00:00Z",
  ndvi_score: 0.82,
  avg_temp_celsius: 28.5,
  rainfall_mm: 12.0,
  soil_moisture_percent: 58.0,
  fungal_risk_factor: 0.15,
  npk_nitrogen: 85,
  npk_phosphorus: 45,
  npk_potassium: 62,
  soil_ph: 6.8,
  source: "PROBE-NPK-8821",
};

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {ui}
    </QueryClientProvider>,
  );

describe("IoT Agronomy & Schemas", () => {
  it("evaluates NPK balance accurately", () => {
    expect(evaluateNpkHealth(30, 25, 40).status).toBe("DEFICIENT");
    expect(evaluateNpkHealth(160, 45, 60).status).toBe("EXCESS");
    const optimal = evaluateNpkHealth(80, 40, 50);
    expect(optimal.status).toBe("OPTIMAL");
    expect(optimal.advice).toMatch(/optimal range/i);
  });

  it("validates sensor device schemas", () => {
    const res = sensorDeviceSchema.safeParse(mockDevice);
    expect(res.success).toBe(true);
  });

  it("validates telemetry ingestion input boundaries", () => {
    const valid = ingestInputSchema.safeParse({
      crop_cycle_id: "00000000-0000-4000-8000-000000000002",
      device_serial: "PROBE-123",
      soil_moisture_percent: 45,
      avg_temp_celsius: 25,
      rainfall_mm: 5,
      npk_nitrogen: 80,
      npk_phosphorus: 40,
      npk_potassium: 50,
      soil_ph: 6.5,
    });
    expect(valid.success).toBe(true);

    const invalid = ingestInputSchema.safeParse({
      crop_cycle_id: "invalid-uuid",
      device_serial: "P",
      soil_moisture_percent: 150, // out of range
      avg_temp_celsius: 80,
      rainfall_mm: -1,
      npk_nitrogen: 400,
      npk_phosphorus: 40,
      npk_potassium: 50,
      soil_ph: 15,
    });
    expect(invalid.success).toBe(false);
  });
});

describe("IoTTelemetryPanel Component", () => {
  it("renders sensor probes and latest soil readings", async () => {
    vi.mocked(api.fetchDevicesByCycle).mockResolvedValue([mockDevice]);
    vi.mocked(api.fetchTelemetryByCycle).mockResolvedValue([mockTelemetry]);

    wrap(<IoTTelemetryPanel cycleId="00000000-0000-4000-8000-000000000002" />);

    const matchingSerials = await screen.findAllByText(/PROBE-NPK-8821/i);
    expect(matchingSerials.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/^ACTIVE$/i)).toBeInTheDocument();
    expect(screen.getByText(/85-45-62/i)).toBeInTheDocument();
    expect(screen.getByText(/6.8/i)).toBeInTheDocument();
    expect(screen.getByText(/Agronomic Prescription:/i)).toBeInTheDocument();
  });

  it("handles new probe registration form", async () => {
    vi.mocked(api.fetchDevicesByCycle).mockResolvedValue([]);
    vi.mocked(api.fetchTelemetryByCycle).mockResolvedValue([]);
    vi.mocked(api.registerSensorDevice).mockResolvedValue(mockDevice);

    wrap(<IoTTelemetryPanel cycleId="00000000-0000-4000-8000-000000000002" />);

    expect(await screen.findByText(/No IoT sensor probes paired yet/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Hardware Probe Serial/i);
    fireEvent.change(input, { target: { value: "PROBE-NPK-9901" } });

    const submitBtn = screen.getByRole("button", { name: /Pair Probe/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.registerSensorDevice).toHaveBeenCalledWith(
        "00000000-0000-4000-8000-000000000002",
        "PROBE-NPK-9901",
        "SOIL_PROBE_NPK",
      );
    });
  });
});
