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
    expect(prediction.predictedYieldTons).toBe(Number((prediction.predictedYieldKg / 1000).toFixed(2)));
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
    expect(Number.isFinite(prediction.daysToHarvest)).toBe(true);
    expect(prediction.harvestDate instanceof Date).toBe(true);
    expect(Number.isNaN(prediction.harvestDate.getTime())).toBe(false);
  });

  it("should accurately resolve all registered marketplace crops without NaN", () => {
    const crops = [
      "Wheat",
      "Soybean",
      "Potato",
      "Tomato",
      "Rice",
      "Cotton",
      "Groundnut",
      "Jute",
      "Millet",
      "Pepper",
      "Maize",
    ];

    crops.forEach((crop) => {
      const pred = runYieldPredictionModel({
        cropType: crop,
        farmSizeHectares: 1.5,
        avgTempCelsius: 28,
        rainfallMm: 80,
        soilMoisturePercent: 60,
        satelliteNdvi: 0.75,
        daysSincePlanting: 30,
      });

      expect(pred.predictedYieldKg).toBeGreaterThan(0);
      expect(Number.isNaN(pred.predictedYieldKg)).toBe(false);
      expect(pred.daysToHarvest).toBeGreaterThan(0);
      expect(Number.isNaN(pred.daysToHarvest)).toBe(false);
      expect(Number.isNaN(pred.harvestDate.getTime())).toBe(false);
      expect(pred.confidenceScore).toBeGreaterThan(0);
    });
  });

  it("should gracefully handle case-insensitive and unknown crops with robust defaults", () => {
    const predLower = runYieldPredictionModel({
      cropType: "  wHeAt  ",
      farmSizeHectares: 2.0,
      avgTempCelsius: 26,
      rainfallMm: 70,
      soilMoisturePercent: 65,
      satelliteNdvi: 0.82,
      daysSincePlanting: 20,
    });
    expect(predLower.predictedYieldKg).toBeGreaterThan(0);

    const predUnknown = runYieldPredictionModel({
      cropType: "Exotic Dragonfruit",
      farmSizeHectares: 0, // Zero boundary
      avgTempCelsius: 25,
      rainfallMm: -10, // Negative boundary
      soilMoisturePercent: 120, // Over-boundary
      satelliteNdvi: 0, // Zero boundary
      daysSincePlanting: -5, // Negative boundary
    });
    expect(predUnknown.predictedYieldKg).toBeGreaterThan(0);
    expect(Number.isNaN(predUnknown.predictedYieldKg)).toBe(false);
    expect(predUnknown.daysToHarvest).toBeGreaterThanOrEqual(1);
    expect(Number.isNaN(predUnknown.harvestDate.getTime())).toBe(false);
  });
});

describe("Currency Formatter", () => {
  it("should format currency with BDT symbol", () => {
    const formatted = CURRENCY.format(1500);
    expect(formatted).toContain("1,500");
    expect(formatted).toContain(CURRENCY.symbol);
  });
});
