-- Migration: Demand Forecasting & Regional Shortage Analytics
-- Provides macroeconomic crop supply/demand trajectories and shortage alerts for procurement planning.

CREATE TABLE IF NOT EXISTS regional_shortage_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region TEXT NOT NULL,
    crop_type TEXT NOT NULL,
    forecast_month TEXT NOT NULL, -- Format: YYYY-MM
    projected_demand_tons NUMERIC(12,2) NOT NULL,
    projected_supply_tons NUMERIC(12,2) NOT NULL,
    deficit_surplus_tons NUMERIC(12,2) GENERATED ALWAYS AS (projected_supply_tons - projected_demand_tons) STORED,
    shortage_risk TEXT CHECK (shortage_risk IN ('NONE', 'MODERATE', 'SEVERE')) NOT NULL,
    recommended_action TEXT NOT NULL,
    historical_price_benchmark_usd NUMERIC(10,2) NOT NULL,
    projected_price_benchmark_usd NUMERIC(10,2) NOT NULL,
    price_trend_pct NUMERIC(5,2) NOT NULL,
    confidence_score NUMERIC(5,2) DEFAULT 88.5 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_region_crop_month UNIQUE (region, crop_type, forecast_month)
);

CREATE INDEX IF NOT EXISTS idx_forecasts_lookup ON regional_shortage_forecasts(region, crop_type);
CREATE INDEX IF NOT EXISTS idx_forecasts_risk ON regional_shortage_forecasts(shortage_risk);

ALTER TABLE regional_shortage_forecasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view shortage forecasts" ON regional_shortage_forecasts;
CREATE POLICY "Anyone can view shortage forecasts" ON regional_shortage_forecasts
    FOR SELECT TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "Admins manage shortage forecasts" ON regional_shortage_forecasts;
CREATE POLICY "Admins manage shortage forecasts" ON regional_shortage_forecasts
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Seed realistic macroeconomic regional benchmarks
INSERT INTO regional_shortage_forecasts 
    (region, crop_type, forecast_month, projected_demand_tons, projected_supply_tons, shortage_risk, recommended_action, historical_price_benchmark_usd, projected_price_benchmark_usd, price_trend_pct, confidence_score)
VALUES
    ('Rajshahi', 'Boro Rice', '2026-11', 14500.0, 11200.0, 'SEVERE', 'Lock forward contracts immediately to hedge against 22% regional production deficit.', 380.0, 450.0, 18.42, 92.4),
    ('Rangpur', 'Potatoes', '2026-11', 22000.0, 26400.0, 'NONE', 'Surplus projected. Spot market floor prices will soften; delay long-term forward commitments.', 180.0, 172.0, -4.44, 89.0),
    ('Dinajpur', 'Maize', '2026-11', 8900.0, 7100.0, 'MODERATE', 'Execute bilateral RFQs with commercial aggregators over the next 14 days.', 290.0, 318.0, 9.65, 87.5),
    ('Bogra', 'Soybean', '2026-11', 5400.0, 3800.0, 'SEVERE', 'Severe shortage expected due to late monsoon rain. Seek inter-regional supply contracts.', 510.0, 615.0, 20.58, 94.1),
    ('Sylhet', 'Mustard', '2026-11', 3200.0, 3450.0, 'NONE', 'Balanced supply. Routine seasonal procurement window.', 620.0, 630.0, 1.61, 85.0),
    ('Khulna', 'Aman Rice', '2026-11', 12000.0, 9800.0, 'MODERATE', 'Coastal salinity delay has pushed harvest window back 18 days. Prepare buffer inventory.', 410.0, 445.0, 8.54, 88.2)
ON CONFLICT (region, crop_type, forecast_month) DO UPDATE 
SET projected_demand_tons = EXCLUDED.projected_demand_tons,
    projected_supply_tons = EXCLUDED.projected_supply_tons,
    shortage_risk = EXCLUDED.shortage_risk,
    recommended_action = EXCLUDED.recommended_action,
    historical_price_benchmark_usd = EXCLUDED.historical_price_benchmark_usd,
    projected_price_benchmark_usd = EXCLUDED.projected_price_benchmark_usd,
    price_trend_pct = EXCLUDED.price_trend_pct,
    confidence_score = EXCLUDED.confidence_score,
    updated_at = now();

-- RPC: get_regional_forecasts
CREATE OR REPLACE FUNCTION get_regional_forecasts(
    p_region TEXT DEFAULT NULL,
    p_crop_type TEXT DEFAULT NULL
)
RETURNS SETOF regional_shortage_forecasts
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT *
    FROM regional_shortage_forecasts
    WHERE (p_region IS NULL OR p_region = '' OR region ILIKE '%' || p_region || '%')
      AND (p_crop_type IS NULL OR p_crop_type = '' OR crop_type ILIKE '%' || p_crop_type || '%')
    ORDER BY 
        CASE shortage_risk
            WHEN 'SEVERE' THEN 1
            WHEN 'MODERATE' THEN 2
            ELSE 3
        END,
        deficit_surplus_tons ASC;
$$;

GRANT EXECUTE ON FUNCTION get_regional_forecasts(TEXT, TEXT) TO authenticated, anon;
