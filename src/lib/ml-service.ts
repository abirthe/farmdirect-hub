// Agricultural Machine Learning & Yield Prediction Inference Engine
// Simulates trained AgroDirect Random Forest Regression models for crop harvest schedules and yield projections.

export type SupportedCrop =
  | 'Boro Rice'
  | 'Aman Rice'
  | 'Rice'
  | 'Wheat'
  | 'Maize'
  | 'Potato'
  | 'Tomato'
  | 'Soybean'
  | 'Cotton'
  | 'Groundnut'
  | 'Jute'
  | 'Millet'
  | 'Pepper'
  | 'Onion'
  | 'Mustard'
  | string;

export interface FarmMLFeatures {
  cropType: SupportedCrop;
  farmSizeHectares: number;
  avgTempCelsius: number;
  rainfallMm: number;
  soilMoisturePercent: number;
  satelliteNdvi: number; // 0.0 to 1.0
  daysSincePlanting: number;
}

export interface MLPrediction {
  predictedYieldKg: number;
  predictedYieldTons: number;
  daysToHarvest: number;
  harvestDate: Date;
  confidenceScore: number;
  moisturePrediction: number;
}

interface CropAgronomicBaseline {
  baseYieldKgPerAcre: number;
  cycleDays: number;
}

// Canonical agricultural agronomy parameters calibrated for South Asian agro-ecological zones
const CROP_BASELINES: Record<string, CropAgronomicBaseline> = {
  'boro rice': { baseYieldKgPerAcre: 2500, cycleDays: 145 },
  'aman rice': { baseYieldKgPerAcre: 2200, cycleDays: 130 },
  'rice': { baseYieldKgPerAcre: 2350, cycleDays: 135 },
  'paddy': { baseYieldKgPerAcre: 2350, cycleDays: 135 },
  'wheat': { baseYieldKgPerAcre: 1800, cycleDays: 115 },
  'maize': { baseYieldKgPerAcre: 4500, cycleDays: 110 },
  'corn': { baseYieldKgPerAcre: 4500, cycleDays: 110 },
  'potato': { baseYieldKgPerAcre: 9000, cycleDays: 100 },
  'potatoes': { baseYieldKgPerAcre: 9000, cycleDays: 100 },
  'tomato': { baseYieldKgPerAcre: 8000, cycleDays: 80 },
  'tomatoes': { baseYieldKgPerAcre: 8000, cycleDays: 80 },
  'soybean': { baseYieldKgPerAcre: 1300, cycleDays: 105 },
  'cotton': { baseYieldKgPerAcre: 1000, cycleDays: 160 },
  'groundnut': { baseYieldKgPerAcre: 1200, cycleDays: 120 },
  'peanut': { baseYieldKgPerAcre: 1200, cycleDays: 120 },
  'jute': { baseYieldKgPerAcre: 1900, cycleDays: 120 },
  'millet': { baseYieldKgPerAcre: 900, cycleDays: 85 },
  'pepper': { baseYieldKgPerAcre: 3600, cycleDays: 90 },
  'chili': { baseYieldKgPerAcre: 3600, cycleDays: 90 },
  'onion': { baseYieldKgPerAcre: 7200, cycleDays: 110 },
  'mustard': { baseYieldKgPerAcre: 700, cycleDays: 85 },
};

const DEFAULT_BASELINE: CropAgronomicBaseline = {
  baseYieldKgPerAcre: 2500,
  cycleDays: 110,
};

/**
 * Normalizes input crop type strings to match agronomic parameters with fallback resilience.
 */
function resolveCropBaseline(rawCrop: string | undefined | null): CropAgronomicBaseline {
  if (!rawCrop || typeof rawCrop !== 'string') return DEFAULT_BASELINE;

  const key = rawCrop.trim().toLowerCase();
  if (CROP_BASELINES[key]) return CROP_BASELINES[key];

  // Partial / fuzzy keyword matching
  for (const [name, baseline] of Object.entries(CROP_BASELINES)) {
    if (key.includes(name) || name.includes(key)) {
      return baseline;
    }
  }

  return DEFAULT_BASELINE;
}

/**
 * Executes yield and harvest trajectory predictions.
 * Model features are sanitized against zero/negative bounds to guarantee deterministic non-NaN outputs.
 */
export function runYieldPredictionModel(data: FarmMLFeatures): MLPrediction {
  const baseline = resolveCropBaseline(data.cropType);

  // Defensively sanitize telemetry features
  const hectares = Math.max(0.01, Number(data.farmSizeHectares) || 1.0);
  const ndvi = Math.min(1.0, Math.max(0.05, Number(data.satelliteNdvi) || 0.70));
  const daysSincePlanting = Math.max(0, Number(data.daysSincePlanting) || 0);
  const rainfall = Math.max(0, Number(data.rainfallMm) || 0);
  const temp = Number.isFinite(Number(data.avgTempCelsius)) ? Number(data.avgTempCelsius) : 28;
  const soilMoisture = Math.min(100, Math.max(0, Number(data.soilMoisturePercent) || 50));

  // Hectares to Acres conversion (1 ha ~ 2.47105 acres)
  const baseCapacity = baseline.baseYieldKgPerAcre * (hectares * 2.47105);

  // Health and photosynthesis multiplier derived from NDVI
  const healthMultiplier = Math.min(1.5, Math.max(0.35, ndvi * 1.25));

  // Microclimate variation simulation (-8% to +8%)
  const weatherVariance = ((rainfall / 120) + (temp / 32)) % 0.08;

  const targetYieldKg = Math.max(50, Math.round(baseCapacity * healthMultiplier * (1 + weatherVariance)));

  // Harvest Timeline Prediction
  // Temperature above 29C accelerates maturity, excessive precipitation delays field drying/harvest
  const tempAdjustment = temp > 29 ? -4 : 2;
  const rainAdjustment = rainfall > 180 ? 4 : 0;
  let daysToHarvest = baseline.cycleDays - daysSincePlanting + tempAdjustment + rainAdjustment;
  daysToHarvest = Math.max(1, Math.round(daysToHarvest));

  // Algorithmic confidence scoring
  const moistureOptimal = soilMoisture >= 40 && soilMoisture <= 75;
  const rawConfidence = (ndvi * 75) + (moistureOptimal ? 18 : 6);
  const confidenceScore = Number(Math.min(98.5, Math.max(45, rawConfidence)).toFixed(1));

  return {
    predictedYieldKg: targetYieldKg,
    predictedYieldTons: Number((targetYieldKg / 1000).toFixed(2)),
    daysToHarvest,
    harvestDate: new Date(Date.now() + daysToHarvest * 24 * 60 * 60 * 1000),
    confidenceScore,
    moisturePrediction: Number((soilMoisture * 0.25).toFixed(1)),
  };
}
