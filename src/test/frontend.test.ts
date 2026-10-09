import { describe, it, expect } from "vitest";
import { runYieldPredictionModel, FarmMLFeatures } from "@/lib/ml-service";
import { CURRENCY } from "@/lib/currency";

describe("ML Service Yield Prediction", () => {
  it("should calculate deterministic positive yield for Boro Rice", () => {
    const features: FarmMLFeatures = {
      cropType: "Boro Rice",
      farmSizeHectares: 2.0,
      avgTempCelsius: 30,
      rainfallMm: 120,
      soilMoisturePercent: 55,
      satelliteNdvi: 0.8,
      daysSincePlanting: 40,
    };

    const prediction = runYieldPredictionModel(features);
    expect(prediction.predictedYieldKg).toBeGreaterThan(0);
    expect(prediction.predictedYieldTons).toBe(prediction.predictedYieldKg / 1000);
    expect(prediction.daysToHarvest).toBeGreaterThanOrEqual(1);
    expect(prediction.confidenceScore).toBeGreaterThanOrEqual(40);
    expect(prediction.confidenceScore).toBeLessThanOrEqual(98.5);
    expect(prediction.harvestDate.getTime()).toBeGreaterThan(Date.now());
  });

  it("should enforce minimum positive days to harvest even when planting days exceed cycle", () => {
    const features: FarmMLFeatures = {
      cropType: "Maize",
      farmSizeHectares: 1.0,
      avgTempCelsius: 35,
      rainfallMm: 50,
      soilMoisturePercent: 50,
      satelliteNdvi: 0.9,
      daysSincePlanting: 200, // Exceeds 110 days cycle
    };

    const prediction = runYieldPredictionModel(features);
    expect(prediction.daysToHarvest).toBeGreaterThanOrEqual(1);
  });
});

describe("Currency Formatter", () => {
  it("should format currency with BDT symbol", () => {
    const formatted = CURRENCY.format(1500);
    expect(formatted).toContain("1,500");
    expect(formatted).toContain(CURRENCY.symbol);
  });
});
