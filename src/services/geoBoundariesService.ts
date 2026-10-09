/**
 * Regional Agricultural Administrative Boundaries Service
 * Supplies GeoJSON polygon definitions for Bangladesh's primary agricultural districts.
 * Enables polygon heatmaps on Leaflet maps (Marketplace, Demand Forecasting, Traceability).
 */

export interface AgriDistrictBoundary {
  id: string;
  name: string;
  division: string;
  primaryCrops: string[];
  centroid: [number, number]; // [lat, lng]
  polygonCoords: [number, number][]; // [lat, lng]
}

export const BANGLADESH_AGRI_DISTRICTS: AgriDistrictBoundary[] = [
  {
    id: "bogra",
    name: "Bogra",
    division: "Rajshahi",
    primaryCrops: ["Maize", "Potato", "Chili", "Rice"],
    centroid: [24.8465, 89.3777],
    polygonCoords: [
      [24.98, 89.20],
      [25.05, 89.45],
      [24.85, 89.65],
      [24.62, 89.48],
      [24.65, 89.25],
      [24.98, 89.20],
    ],
  },
  {
    id: "rajshahi",
    name: "Rajshahi",
    division: "Rajshahi",
    primaryCrops: ["Mango", "Wheat", "Lentil", "Rice"],
    centroid: [24.3745, 88.6042],
    polygonCoords: [
      [24.55, 88.40],
      [24.62, 88.75],
      [24.38, 88.90],
      [24.22, 88.65],
      [24.30, 88.35],
      [24.55, 88.40],
    ],
  },
  {
    id: "rangpur",
    name: "Rangpur",
    division: "Rangpur",
    primaryCrops: ["Potato", "Tobacco", "Maize", "Jute"],
    centroid: [25.7439, 89.2752],
    polygonCoords: [
      [25.88, 89.10],
      [25.92, 89.42],
      [25.68, 89.50],
      [25.55, 89.25],
      [25.68, 88.98],
      [25.88, 89.10],
    ],
  },
  {
    id: "dinajpur",
    name: "Dinajpur",
    division: "Rangpur",
    primaryCrops: ["Kataribhog Rice", "Litchi", "Wheat", "Maize"],
    centroid: [25.6217, 88.6355],
    polygonCoords: [
      [25.80, 88.50],
      [25.85, 88.80],
      [25.55, 88.90],
      [25.38, 88.60],
      [25.50, 88.40],
      [25.80, 88.50],
    ],
  },
  {
    id: "jessore",
    name: "Jessore",
    division: "Khulna",
    primaryCrops: ["Vegetables", "Date Palm", "Flower Floriculture", "Mustard"],
    centroid: [23.1664, 89.2081],
    polygonCoords: [
      [23.32, 89.05],
      [23.35, 89.38],
      [23.10, 89.45],
      [22.98, 89.20],
      [23.08, 88.95],
      [23.32, 89.05],
    ],
  },
  {
    id: "mymensingh",
    name: "Mymensingh",
    division: "Mymensingh",
    primaryCrops: ["Aman Paddy", "Aquaculture Fish", "Mustard", "Vegetables"],
    centroid: [24.7471, 90.4203],
    polygonCoords: [
      [24.95, 90.25],
      [25.02, 90.60],
      [24.68, 90.70],
      [24.50, 90.35],
      [24.65, 90.15],
      [24.95, 90.25],
    ],
  },
];

export function getAgriDistrictById(id: string): AgriDistrictBoundary | undefined {
  return BANGLADESH_AGRI_DISTRICTS.find((d) => d.id === id.toLowerCase());
}

export function getAllDistrictPolygons(): [number, number][][] {
  return BANGLADESH_AGRI_DISTRICTS.map((d) => d.polygonCoords);
}
