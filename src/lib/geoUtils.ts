// Geodesic calculations and polygon spatial metrics for precision agriculture parcels.

const EARTH_RADIUS_METERS = 6378137;

/**
 * Calculates geodesic area of a polygon in hectares using spherical excess.
 * Coordinates are array of [lat, lng].
 */
export function calculatePolygonAreaHectares(coords: [number, number][]): number {
  if (!coords || coords.length < 3) return 0;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  let totalArea = 0;
  const n = coords.length;

  for (let i = 0; i < n; i++) {
    const prev = coords[(i - 1 + n) % n];
    const curr = coords[i];
    const next = coords[(i + 1) % n];

    const latRad = toRad(curr[0]);
    const prevLngRad = toRad(prev[1]);
    const nextLngRad = toRad(next[1]);

    totalArea += (nextLngRad - prevLngRad) * Math.sin(latRad);
  }

  const areaSqMeters = Math.abs((totalArea * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 2);
  const hectares = areaSqMeters / 10000;
  return Number(hectares.toFixed(2));
}

/**
 * Calculates perimeter of a polygon in kilometers using the Haversine formula.
 */
export function calculatePolygonPerimeterKm(coords: [number, number][]): number {
  if (!coords || coords.length < 2) return 0;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  let totalDistanceMeters = 0;
  const n = coords.length;

  for (let i = 0; i < n; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % n];

    const dLat = toRad(p2[0] - p1[0]);
    const dLng = toRad(p2[1] - p1[1]);
    const lat1 = toRad(p1[0]);
    const lat2 = toRad(p2[0]);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    totalDistanceMeters += EARTH_RADIUS_METERS * c;
  }

  return Number((totalDistanceMeters / 1000).toFixed(2));
}

/**
 * Calculates centroid center [lat, lng] of a polygon.
 */
export function calculatePolygonCenter(coords: [number, number][]): [number, number] {
  if (!coords || coords.length === 0) return [23.8103, 90.4125];

  let sumLat = 0;
  let sumLng = 0;
  coords.forEach(([lat, lng]) => {
    sumLat += lat;
    sumLng += lng;
  });

  return [
    Number((sumLat / coords.length).toFixed(4)),
    Number((sumLng / coords.length).toFixed(4)),
  ];
}

/**
 * Formats hectare area into multi-unit metrics (hectares, acres, square meters).
 */
export function formatParcelMetrics(hectares: number) {
  const acres = Number((hectares * 2.47105).toFixed(2));
  const sqMeters = Math.round(hectares * 10000);

  return {
    hectares: `${hectares.toLocaleString()} ha`,
    acres: `${acres.toLocaleString()} acres`,
    sqMeters: `${sqMeters.toLocaleString()} m²`,
    bigha: `${Number((acres * 3.025).toFixed(2))} bigha`, // South Asian land unit
  };
}
