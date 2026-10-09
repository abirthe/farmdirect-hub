-- Migration: Precision Agriculture Prescription Engine
-- Prescribes exact irrigation, NPK fertilization, and fungal prevention schedules based on IoT microclimates.

CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_cycle_id UUID REFERENCES crop_cycles(id) ON DELETE CASCADE NOT NULL,
    farmer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    category TEXT CHECK (category IN ('IRRIGATION', 'FERTILIZER_NPK', 'FUNGAL_PREVENTION', 'HARVEST_PREP')) NOT NULL,
    urgency TEXT CHECK (urgency IN ('ROUTINE', 'ATTENTION', 'CRITICAL')) NOT NULL,
    action_title TEXT NOT NULL,
    dosage_instruction TEXT NOT NULL,
    rationale TEXT NOT NULL,
    target_date DATE NOT NULL,
    status TEXT CHECK (status IN ('SCHEDULED', 'APPLIED', 'SKIPPED')) DEFAULT 'SCHEDULED' NOT NULL,
    applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_cycle ON prescriptions(crop_cycle_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_farmer ON prescriptions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers view own prescriptions" ON prescriptions;
CREATE POLICY "Farmers view own prescriptions" ON prescriptions
    FOR SELECT TO authenticated
    USING (
        farmer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM farms f
            JOIN crop_cycles c ON c.farm_id = f.id
            WHERE c.id = prescriptions.crop_cycle_id AND f.farmer_id = auth.uid()
        ) OR
        is_admin()
    );

DROP POLICY IF EXISTS "Farmers update own prescriptions" ON prescriptions;
CREATE POLICY "Farmers update own prescriptions" ON prescriptions
    FOR UPDATE TO authenticated
    USING (farmer_id = auth.uid() OR is_admin())
    WITH CHECK (farmer_id = auth.uid() OR is_admin());

-- RPC: generate_cycle_prescriptions
CREATE OR REPLACE FUNCTION generate_cycle_prescriptions(p_cycle_id UUID)
RETURNS SETOF prescriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cycle RECORD;
    v_farmer_id UUID;
    v_latest_telemetry RECORD;
    v_irrigation_urgency TEXT := 'ROUTINE';
    v_irrigation_title TEXT := 'Standard Sub-Surface Drip Irrigation';
    v_irrigation_dosage TEXT := '25 mm equivalent per hectare over 4 hours';
    v_irrigation_rationale TEXT := 'Baseline evapotranspiration replenishment.';
    
    v_npk_urgency TEXT := 'ROUTINE';
    v_npk_title TEXT := 'Balanced NPK Maintenance Dressing';
    v_npk_dosage TEXT := 'NPK 14-14-14 at 50 kg/hectare';
    v_npk_rationale TEXT := 'Sustained macronutrient availability.';
    
    v_fungal_urgency TEXT := 'ROUTINE';
    v_fungal_title TEXT := 'Preventative Foliar Bio-Shield';
    v_fungal_dosage TEXT := 'Neem-oil extract 3ml/L water or Trichoderma bio-inoculant';
    v_fungal_rationale TEXT := 'Standard preventative canopy defense.';
BEGIN
    SELECT c.*, f.farmer_id as farm_farmer_id
    INTO v_cycle
    FROM crop_cycles c
    JOIN farms f ON f.id = c.farm_id
    WHERE c.id = p_cycle_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Crop cycle % not found', p_cycle_id;
    END IF;

    v_farmer_id := v_cycle.farm_farmer_id;
    IF auth.uid() != v_farmer_id AND NOT is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: only the crop cycle farmer or admin may generate prescriptions';
    END IF;

    -- Fetch most recent telemetry record
    SELECT * INTO v_latest_telemetry
    FROM telemetry_logs
    WHERE crop_cycle_id = p_cycle_id
    ORDER BY date_logged DESC
    LIMIT 1;

    -- 1. Precision Irrigation Evaluation
    IF v_latest_telemetry.soil_moisture_percent IS NOT NULL THEN
        IF v_latest_telemetry.soil_moisture_percent < 40.0 THEN
            v_irrigation_urgency := 'CRITICAL';
            v_irrigation_title := 'Emergency Root-Zone Deep Irrigation';
            v_irrigation_dosage := '45 mm flood/drip soak in early morning (05:00 - 08:00)';
            v_irrigation_rationale := format('Critical soil moisture depletion (%s%% detected). Crop wilting imminent.', v_latest_telemetry.soil_moisture_percent);
        ELSIF v_latest_telemetry.soil_moisture_percent < 55.0 THEN
            v_irrigation_urgency := 'ATTENTION';
            v_irrigation_title := 'Supplementary Furrow/Drip Irrigation';
            v_irrigation_dosage := '30 mm moisture boost over 3 hours';
            v_irrigation_rationale := format('Soil moisture at %s%% is below optimal vegetative comfort threshold.', v_latest_telemetry.soil_moisture_percent);
        ELSIF v_latest_telemetry.soil_moisture_percent > 75.0 THEN
            v_irrigation_urgency := 'ATTENTION';
            v_irrigation_title := 'Suspension & Field Drainage Check';
            v_irrigation_dosage := '0 mm (Halt all water input; clear boundary drainage trenches)';
            v_irrigation_rationale := format('Soil moisture saturation at %s%% risks root anoxia and damping-off.', v_latest_telemetry.soil_moisture_percent);
        END IF;
    END IF;

    -- 2. Precision NPK Fertilizer Evaluation
    IF v_latest_telemetry.npk_nitrogen IS NOT NULL THEN
        IF v_latest_telemetry.npk_nitrogen < 45.0 THEN
            v_npk_urgency := 'CRITICAL';
            v_npk_title := 'Urgent Nitrogen Top-Dressing';
            v_npk_dosage := 'Granular Urea (46-0-0) at 65 kg/hectare mixed with moist soil';
            v_npk_rationale := format('Severe nitrogen deficiency (%s mg/kg). Chlorosis risk detected.', v_latest_telemetry.npk_nitrogen);
        ELSIF v_latest_telemetry.npk_nitrogen > 130.0 THEN
            v_npk_urgency := 'ATTENTION';
            v_npk_title := 'Nitrogen Application Freeze';
            v_npk_dosage := '0 kg Urea; apply gypsum or organic mulch only';
            v_npk_rationale := format('Excess soil nitrogen (%s mg/kg) detected. Prevent vegetative lodge and nitrate toxicity.', v_latest_telemetry.npk_nitrogen);
        END IF;
    END IF;

    -- 3. Precision Fungal Risk Evaluation
    IF v_latest_telemetry.fungal_risk_factor IS NOT NULL AND v_latest_telemetry.fungal_risk_factor > 0.35 THEN
        v_fungal_urgency := 'CRITICAL';
        v_fungal_title := 'Targeted Anti-Fungal Treatment';
        v_fungal_dosage := 'Copper Oxychloride (2.5g/L) or Carbendazim 50% WP (1g/L)';
        v_fungal_rationale := format('Fungal risk index spiked to %s due to high microclimate humidity and temperature.', v_latest_telemetry.fungal_risk_factor);
    END IF;

    -- Upsert prescriptions for this cycle (delete older scheduled ones to refresh with latest sensor data)
    DELETE FROM prescriptions
    WHERE crop_cycle_id = p_cycle_id AND status = 'SCHEDULED';

    INSERT INTO prescriptions (crop_cycle_id, farmer_id, category, urgency, action_title, dosage_instruction, rationale, target_date, status)
    VALUES
        (p_cycle_id, v_farmer_id, 'IRRIGATION', v_irrigation_urgency, v_irrigation_title, v_irrigation_dosage, v_irrigation_rationale, CURRENT_DATE + INTERVAL '1 day', 'SCHEDULED'),
        (p_cycle_id, v_farmer_id, 'FERTILIZER_NPK', v_npk_urgency, v_npk_title, v_npk_dosage, v_npk_rationale, CURRENT_DATE + INTERVAL '2 days', 'SCHEDULED'),
        (p_cycle_id, v_farmer_id, 'FUNGAL_PREVENTION', v_fungal_urgency, v_fungal_title, v_fungal_dosage, v_fungal_rationale, CURRENT_DATE + INTERVAL '3 days', 'SCHEDULED');

    RETURN QUERY
    SELECT * FROM prescriptions
    WHERE crop_cycle_id = p_cycle_id
    ORDER BY created_at DESC;
END;
$$;

-- RPC: mark_prescription_applied
CREATE OR REPLACE FUNCTION mark_prescription_applied(
    p_prescription_id UUID,
    p_status TEXT
)
RETURNS prescriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_record prescriptions;
BEGIN
    IF p_status NOT IN ('APPLIED', 'SKIPPED') THEN
        RAISE EXCEPTION 'Status must be APPLIED or SKIPPED';
    END IF;

    SELECT * INTO v_record FROM prescriptions WHERE id = p_prescription_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Prescription % not found', p_prescription_id;
    END IF;

    IF v_record.farmer_id != auth.uid() AND NOT is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: only prescription owner or admin can update status';
    END IF;

    UPDATE prescriptions
    SET status = p_status,
        applied_at = CASE WHEN p_status = 'APPLIED' THEN now() ELSE NULL END
    WHERE id = p_prescription_id
    RETURNING * INTO v_record;

    RETURN v_record;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_cycle_prescriptions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_prescription_applied(UUID, TEXT) TO authenticated;
