/**
 * Logistics Routing Service
 * Connects to OSRM (Open Source Routing Machine) public open API (powered by OpenStreetMap).
 * Provides driving route geometries, distance (km), and estimated travel duration
 * between farm origins and buyer distribution warehouses in Bangladesh.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteSummary {
  distanceKm: number;
  durationMinutes: number;
  waypoints: [number, number][]; // [lat, lng] array suitable for Leaflet Polyline
  source: "OSRM_API" | "HAVERSINE_FALLBACK";
}

/**
 * Standard agricultural transport hubs across Bangladesh
 */
export const BANGLADESH_TRANSIT_HUBS = {
  DHAKA_CENTRAL_WAREHOUSE: { name: "Tejgaon Central Agro Terminal, Dhaka", lat: 23.7594, lng: 90.3923 },
  CHITTAGONG_PORT_HUB: { name: "Chittagong Port Export Depot", lat: 22.3350, lng: 91.8325 },
  BOGRA_AGGREGATION_DEPOT: { name: "Bogra Grain Silo & Transit Yard", lat: 24.8510, lng: 89.3697 },
  RAJSHAHI_COLD_STORAGE: { name: "Rajshahi Mango & Agro Cold Storage", lat: 24.3745, lng: 88.6042 },
  JESSORE_BORDER_DEPOT: { name: "Jessore Benapole Agri Logistics Depot", lat: 23.1664, lng: 89.2081 },
} as const;

/**
 * Great-circle distance fallback calculation in case of network offline / rate limits
 */
function calculateHaversineDistance(origin: LatLng, dest: LatLng): number {
  const R = 6371; // Earth radius in km
  const dLat = ((dest.lat - origin.lat) * Math.PI) / 180;
  const dLng = ((dest.lng - origin.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((dest.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Fetches driving transit route from public OSRM router
 */
export async function getDrivingRoute(
  origin: LatLng,
  destination: LatLng
): Promise<RouteSummary> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) {
      throw new Error(`OSRM API error: status ${res.status}`);
    }

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) {
      throw new Error("No route found between coordinates.");
    }

    const primaryRoute = data.routes[0];
    const distanceKm = Number((primaryRoute.distance / 1000).toFixed(1));
    const durationMinutes = Math.round(primaryRoute.duration / 60);

    // OSRM returns coordinates as [lng, lat]. Convert to Leaflet's [lat, lng] format:
    const coordinates: [number, number][] = (
      primaryRoute.geometry?.coordinates ?? []
    ).map(([lng, lat]: [number, number]) => [lat, lng]);

    return {
      distanceKm,
      durationMinutes,
      waypoints: coordinates.length > 0 ? coordinates : [[origin.lat, origin.lng], [destination.lat, destination.lng]],
      source: "OSRM_API",
    };
  } catch (err) {
    // Graceful fallback with haversine distance and simulated road winding factor (1.3x)
    const directKm = calculateHaversineDistance(origin, destDistance(destination));
    const roadKm = Number((directKm * 1.3).toFixed(1));
    // Avg Bangladesh highway truck speed: 45 km/h
    const estMinutes = Math.round((roadKm / 45) * 60);

    return {
      distanceKm: roadKm,
      durationMinutes: estMinutes,
      waypoints: [
        [origin.lat, origin.lng],
        // Midpoint with slight curve
        [(origin.lat + destination.lat) / 2 + 0.05, (origin.lng + destination.lng) / 2 - 0.05],
        [destination.lat, destination.lng],
      ],
      source: "HAVERSINE_FALLBACK",
    };
  }

  function destDistance(d: LatLng) {
    return d;
  }
}
