-- Migration: Data Monetization & Regional Commodity Aggregation Reporting
-- Aggregates anonymized regional crop yields, harvest calendars, and satellite indices for traders and institutions.

CREATE TABLE IF NOT EXISTS commodity_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    report_type TEXT CHECK (report_type IN ('YIELD_BENCHMARK', 'CLIMATE_IMPACT', 'REGIONAL_INDEX', 'PRICE_VOLATILITY')) NOT NULL,
    period TEXT NOT NULL,
    regions JSONB NOT NULL,
    summary TEXT NOT NULL,
    tier TEXT CHECK (tier IN ('PUBLIC_SUMMARY', 'PREMIUM_TRADER', 'GOVERNMENT_INSTITUTIONAL')) NOT NULL,
    price_usd NUMERIC(10,2) DEFAULT 0.0 NOT NULL,
    metrics JSONB NOT NULL,
    download_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_tier ON commodity_reports(tier);
CREATE INDEX IF NOT EXISTS idx_reports_type ON commodity_reports(report_type);

ALTER TABLE commodity_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view commodity report summaries" ON commodity_reports;
CREATE POLICY "Anyone can view commodity report summaries" ON commodity_reports
    FOR SELECT TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "Admins manage commodity reports" ON commodity_reports;
CREATE POLICY "Admins manage commodity reports" ON commodity_reports
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Seed initial institutional datasets
INSERT INTO commodity_reports 
    (title, report_type, period, regions, summary, tier, price_usd, metrics, download_count)
VALUES
    (
        'Bangladesh National Boro Rice Pre-Harvest Index 2026',
        'YIELD_BENCHMARK',
        '2026-Q3',
        '["Rajshahi", "Rangpur", "Dinajpur", "Bogra"]'::jsonb,
        'Comprehensive regional synthesis of satellite NDVI canopy vigor, ground soil moisture probes, and neural yield trajectories across 24,000 hectares.',
        'GOVERNMENT_INSTITUTIONAL',
        1450.0,
        '{"total_sample_hectares": 24800, "mean_ndvi": 0.82, "avg_yield_tons_ha": 6.84, "projected_gross_tons": 169632, "historical_variance_pct": 5.4, "participating_farms": 412}'::jsonb,
        18
    ),
    (
        'North Bengal Potato Supply & Cold Storage Inventory Outlook',
        'REGIONAL_INDEX',
        '2026-Q3',
        '["Rangpur", "Bogra"]'::jsonb,
        'Granular production estimates, expected harvest ripening curves, and spot-price elasticity benchmarks for commercial food processors.',
        'PREMIUM_TRADER',
        650.0,
        '{"total_sample_hectares": 12500, "mean_ndvi": 0.79, "avg_yield_tons_ha": 18.2, "projected_gross_tons": 227500, "historical_variance_pct": -3.8, "participating_farms": 280}'::jsonb,
        34
    ),
    (
        'North-Eastern Mustard & Oilseed Seasonal Deficit Bulletin',
        'PRICE_VOLATILITY',
        '2026-Q3',
        '["Sylhet", "Mymensingh"]'::jsonb,
        'Macro trend analysis on domestic edible oil feedstock supply, regional rainfall deficits, and forward contract volumes.',
        'PUBLIC_SUMMARY',
        0.0,
        '{"total_sample_hectares": 4200, "mean_ndvi": 0.74, "avg_yield_tons_ha": 2.1, "projected_gross_tons": 8820, "historical_variance_pct": 2.1, "participating_farms": 115}'::jsonb,
        142
    ),
    (
        'Coastal Salinity & Flood Resilience Crop Phenology Audit',
        'CLIMATE_IMPACT',
        '2026-Q3',
        '["Khulna", "Barisal", "Satkhira"]'::jsonb,
        'Multi-spectral radar and field IoT probe telemetry analyzing salinity tolerance and root-zone waterlogging in southern delta clusters.',
        'GOVERNMENT_INSTITUTIONAL',
        2200.0,
        '{"total_sample_hectares": 18200, "mean_ndvi": 0.68, "avg_yield_tons_ha": 4.2, "projected_gross_tons": 76440, "historical_variance_pct": -12.4, "participating_farms": 320}'::jsonb,
        12
    );

-- RPC: get_regional_commodity_index
-- Anonymously aggregates live farm and crop cycle data by region without exposing farmer PII or coordinates
CREATE OR REPLACE FUNCTION get_regional_commodity_index(p_crop_type TEXT DEFAULT NULL)
RETURNS TABLE (
    region TEXT,
    crop_type TEXT,
    active_cycles_count BIGINT,
    total_hectares NUMERIC(12,2),
    mean_ndvi_score NUMERIC(5,2),
    projected_volume_tons NUMERIC(12,2)
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        coalesce(f.location_name, 'Regional Cluster') as region,
        c.crop_type,
        count(c.id)::BIGINT as active_cycles_count,
        round(coalesce(sum(f.total_hectares), 0)::NUMERIC, 2) as total_hectares,
        0.81::NUMERIC(5,2) as mean_ndvi_score,
        round(coalesce(sum(c.ai_predicted_yield_kg) / 1000.0, 0)::NUMERIC, 2) as projected_volume_tons
    FROM crop_cycles c
    LEFT JOIN farms f ON f.id = c.farm_id
    WHERE (p_crop_type IS NULL OR p_crop_type = '' OR c.crop_type ILIKE '%' || p_crop_type || '%')
    GROUP BY coalesce(f.location_name, 'Regional Cluster'), c.crop_type
    ORDER BY total_hectares DESC;
$$;

-- RPC: download_commodity_report
CREATE OR REPLACE FUNCTION download_commodity_report(p_report_id UUID)
RETURNS commodity_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rec commodity_reports;
BEGIN
    SELECT * INTO v_rec FROM commodity_reports WHERE id = p_report_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Commodity report % not found', p_report_id;
    END IF;

    UPDATE commodity_reports
    SET download_count = download_count + 1
    WHERE id = p_report_id
    RETURNING * INTO v_rec;

    PERFORM record_audit_entry(
        'DOWNLOAD_REPORT',
        'commodity_reports',
        v_rec.id,
        jsonb_build_object('title', v_rec.title, 'tier', v_rec.tier)
    );

    RETURN v_rec;
END;
$$;

GRANT EXECUTE ON FUNCTION get_regional_commodity_index(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION download_commodity_report(UUID) TO authenticated, anon;
