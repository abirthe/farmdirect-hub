export interface FarmMLFeatures {
  cropType: 'Boro Rice' | 'Aman Rice' | 'Tomato' | 'Potato' | 'Maize';
  farmSizeHectares: number; // Changed from Acres to securely match Database Schema standards
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

/**
 * Mocks an AgroDirect Random Forest Regressor Prediction model.
 * Inspired by SKLearn python models for Yield and Harvest timelines.
 */
export function runYieldPredictionModel(data: FarmMLFeatures): MLPrediction {
  // Base constants mapped from the training set (yielding per Acre)
  const baseYield = { 'Boro Rice': 2500, 'Aman Rice': 2200, 'Tomato': 8000, 'Potato': 9000, 'Maize': 4500 };
  const baseDays = { 'Boro Rice': 145, 'Aman Rice': 130, 'Tomato': 80, 'Potato': 100, 'Maize': 110 };
  
  // Simulate Random Forest regression output using deterministic math based on features
  // Yield is heavily influenced by NDVI (health), farm size, and base genetics
  // We natively convert Hectares back to Acres for the old python model output map
  const baseCapacity = baseYield[data.cropType] * (data.farmSizeHectares * 2.47105);
  const healthMultiplier = data.satelliteNdvi * 1.2;
  
  // Weather impact simulation (-5% to +5% variation based on temp/rain algorithms)
  const weatherVariance = ((data.rainfallMm / 100) + (data.avgTempCelsius / 30)) % 0.1;

  const targetYieldKg = baseCapacity * healthMultiplier + (baseCapacity * weatherVariance);
  
  // Harvest Timeline Prediction
  // Warmer weather accelerates ripening slightly, massive rainfall delays harvest
  const tempAdjustment = data.avgTempCelsius > 28 ? -4 : 3;
  const rainAdjustment = data.rainfallMm > 200 ? 5 : 0;
  let daysToHarvest = baseDays[data.cropType] - data.daysSincePlanting + tempAdjustment + rainAdjustment;
  
  daysToHarvest = Math.max(1, daysToHarvest); // Prevent negative days!

  // Confidence is inherently tied to satellite clarity and soil consistency
  const confidenceScore = (data.satelliteNdvi * 100) + (data.soilMoisturePercent > 40 && data.soilMoisturePercent < 70 ? 5 : -5);

  return {
    predictedYieldKg: targetYieldKg,
    predictedYieldTons: targetYieldKg / 1000,
    daysToHarvest: Math.round(daysToHarvest),
    harvestDate: new Date(Date.now() + Math.round(daysToHarvest) * 24 * 60 * 60 * 1000),
    confidenceScore: Math.min(98.5, Math.max(40, confidenceScore)), // Cap between 40-98.5%
    moisturePrediction: data.soilMoisturePercent * 0.25 // mock metric
  };
}
