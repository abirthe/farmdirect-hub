import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAgriMicroclimate, BANGLADESH_AGRI_HUBS } from "@/services/agriWeatherService";

describe("agriWeatherService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exports known agricultural hubs with valid geographic coordinates", () => {
    expect(BANGLADESH_AGRI_HUBS.length).toBeGreaterThanOrEqual(4);
    const bogra = BANGLADESH_AGRI_HUBS.find(h => h.name.includes("Bogra"));
    expect(bogra).toBeDefined();
    expect(bogra?.lat).toBeCloseTo(24.8465, 2);
    expect(bogra?.lng).toBeCloseTo(89.3777, 2);
  });

  it("handles live API data parsing accurately", async () => {
    const mockApiResponse = {
      current: {
        temperature_2m: 29.4,
        apparent_temperature: 32.1,
        relative_humidity_2m: 78,
        precipitation: 1.2,
        soil_moisture_0_to_1cm: 0.35,
        soil_temperature_0_to_7cm: 27.2,
        direct_normal_irradiance: 520,
        et0_fao_evapotranspiration: 4.2
      }
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse
    }) as unknown as typeof fetch;

    const reading = await fetchAgriMicroclimate(24.8465, 89.3777, "Bogra Test");

    expect(reading.temperatureCelsius).toBe(29.4);
    expect(reading.apparentTempCelsius).toBe(32.1);
    expect(reading.relativeHumidityPercent).toBe(78);
    expect(reading.precipitationMm).toBe(1.2);
    expect(reading.soilMoisturePercent).toBeGreaterThan(0);
    expect(reading.fungalRiskFactor).toBeGreaterThan(0);
    expect(reading.irrigationNeedStatus).toBeDefined();
  });

  it("falls back gracefully without throwing if network is unavailable", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network timeout")) as unknown as typeof fetch;

    const fallbackReading = await fetchAgriMicroclimate(24.3745, 88.6042, "Rajshahi Offline");

    expect(fallbackReading).toBeDefined();
    expect(fallbackReading.temperatureCelsius).toBeGreaterThan(0);
    expect(fallbackReading.soilMoisturePercent).toBeGreaterThan(0);
    expect(fallbackReading.locationName).toBe("Rajshahi Offline");
  });
});
