// Unit tests for geodesic polygon area, perimeter, and parcel metric calculations.
import { describe, it, expect } from "vitest";
import {
  calculatePolygonAreaHectares,
  calculatePolygonPerimeterKm,
  calculatePolygonCenter,
  formatParcelMetrics,
} from "@/lib/geoUtils";

describe("Geodesic Utility Calculations", () => {
  // Approximate 1km x 1km square at Bogura, Bangladesh (approx 100 hectares)
  // 1 deg lat ~ 111 km, so 0.009 deg ~ 1 km
  // At 24.8 deg lat, cos(24.8 deg) ~ 0.9077 -> 1 deg lng ~ 101 km, 0.0099 deg ~ 1 km
  const testPolygon: [number, number][] = [
    [24.8465, 89.3777],
    [24.8555, 89.3777],
    [24.8555, 89.3876],
    [24.8465, 89.3876],
  ];

  it("calculates positive non-zero hectare area for a valid polygon", () => {
    const ha = calculatePolygonAreaHectares(testPolygon);
    expect(ha).toBeGreaterThan(90);
    expect(ha).toBeLessThan(110);
  });

  it("returns 0 for empty or invalid polygons with < 3 coordinates", () => {
    expect(calculatePolygonAreaHectares([])).toBe(0);
    expect(calculatePolygonAreaHectares([[24.8465, 89.3777], [24.8555, 89.3777]])).toBe(0);
  });

  it("calculates perimeter in kilometers correctly", () => {
    const km = calculatePolygonPerimeterKm(testPolygon);
    expect(km).toBeGreaterThan(3.5);
    expect(km).toBeLessThan(4.5);
  });

  it("calculates centroid center properly", () => {
    const center = calculatePolygonCenter(testPolygon);
    expect(center[0]).toBeCloseTo(24.851, 2);
    expect(center[1]).toBeCloseTo(89.382, 2);
  });

  it("formats parcel metrics with South Asian bigha units", () => {
    const metrics = formatParcelMetrics(10);
    expect(metrics.hectares).toBe("10 ha");
    expect(metrics.acres).toBe("24.71 acres");
    expect(metrics.sqMeters).toBe("100,000 m²");
    expect(metrics.bigha).toContain("bigha");
  });
});
