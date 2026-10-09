import { describe, it, expect, vi } from "vitest";
import { getDrivingRoute, BANGLADESH_TRANSIT_HUBS } from "@/services/routingService";
import { fetchFarmNdvi } from "@/services/satelliteNdviService";
import { BANGLADESH_AGRI_DISTRICTS, getAllDistrictPolygons } from "@/services/geoBoundariesService";
import { getLiveCommodityQuotes, getCommodityQuoteByCrop } from "@/services/commodityPriceFeedService";

describe("Open Free Web APIs & Services Suite", () => {
  describe("OSRM Logistics Routing Service", () => {
    it("returns route summary with distance, ETA and Leaflet coordinates", async () => {
      const origin = { lat: 24.8465, lng: 89.3777 }; // Bogra
      const destination = BANGLADESH_TRANSIT_HUBS.DHAKA_CENTRAL_WAREHOUSE;

      const route = await getDrivingRoute(origin, destination);

      expect(route).toBeDefined();
      expect(route.distanceKm).toBeGreaterThan(50);
      expect(route.durationMinutes).toBeGreaterThan(60);
      expect(route.waypoints.length).toBeGreaterThanOrEqual(2);
      expect(["OSRM_API", "HAVERSINE_FALLBACK"]).toContain(route.source);
    });

    it("falls back gracefully when network fails", async () => {
      const origin = { lat: 24.8465, lng: 89.3777 };
      const destination = { lat: 23.7594, lng: 90.3923 };

      // Spy on fetch to simulate failure
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error("Network Down"));

      const route = await getDrivingRoute(origin, destination);
      expect(route.source).toBe("HAVERSINE_FALLBACK");
      expect(route.distanceKm).toBeGreaterThan(0);

      globalThis.fetch = originalFetch;
    });
  });

  describe("Satellite NDVI & Earth Observation Telemetry", () => {
    it("derives NDVI score, vigor, and soil deficit from coordinates", async () => {
      const telemetry = await fetchFarmNdvi(24.8465, 89.3777);

      expect(telemetry.ndviScore).toBeGreaterThanOrEqual(0.35);
      expect(telemetry.ndviScore).toBeLessThanOrEqual(1.0);
      expect(telemetry.chlorophyllIndex).toBeGreaterThanOrEqual(0.0);
      expect(["CRITICAL_STRESS", "MODERATE", "HEALTHY", "EXCELLENT"]).toContain(telemetry.vegetativeVigor);
      expect(telemetry.healthColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  describe("Regional Agri Geospatial Boundaries", () => {
    it("provides valid GeoJSON polygon rings for major agrarian districts", () => {
      const polygons = getAllDistrictPolygons();
      expect(polygons.length).toBe(BANGLADESH_AGRI_DISTRICTS.length);
      expect(polygons.length).toBeGreaterThan(4);

      // Verify each polygon is a closed or valid ring with latitude/longitude
      polygons.forEach((poly) => {
        expect(poly.length).toBeGreaterThanOrEqual(3);
        const [lat, lng] = poly[0];
        expect(lat).toBeGreaterThan(20);
        expect(lat).toBeLessThan(27);
        expect(lng).toBeGreaterThan(87);
        expect(lng).toBeLessThan(93);
      });
    });
  });

  describe("Commodity Market Price Feeds", () => {
    it("retrieves daily DAM wholesale quotes and individual crop benchmark", async () => {
      const quotes = await getLiveCommodityQuotes();
      expect(quotes.length).toBeGreaterThanOrEqual(5);

      const maizeQuote = getCommodityQuoteByCrop("Maize");
      expect(maizeQuote).not.toBeNull();
      expect(maizeQuote?.wholesalePriceBdtPerTon).toBeGreaterThan(20000);
      expect(maizeQuote?.dailyVolumeTons).toBeGreaterThan(100);
    });
  });
});
