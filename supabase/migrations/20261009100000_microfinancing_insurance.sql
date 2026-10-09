-- Micro-financing & parametric insurance underwriting passports.
-- Compiles crop health, yield predictions, and weather variance into verifiable credit & insurance risk scores.
-- Rollback:
--   DROP FUNCTION IF EXISTS public.generate_underwriting_passport(UUID);
--   DROP TABLE IF EXISTS public.underwriting_passports;

CREATE TABLE IF NOT EXISTS public.underwriting_passports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  crop_cycle_id         UUID NOT NULL REFERENCES public.crop_cycles(id) ON DELETE CASCADE,
  risk_tier             TEXT NOT NULL CHECK (risk_tier IN ('AAA', 'AA', 'A', 'BBB', 'HIGH_RISK')),
  credit_score          INTEGER NOT NULL CHECK (credit_score BETWEEN 300 AND 850),
  max_eligible_credit   NUMERIC(14,2) NOT NULL CHECK (max_eligible_credit >= 0),
  parametric_coverage   NUMERIC(14,2) NOT NULL CHECK (parametric_coverage >= 0),
  ndvi_stability_index  NUMERIC(5,3) NOT NULL,
  weather_hazard_index  NUMERIC(5,3) NOT NULL,
  passport_hash         TEXT NOT NULL UNIQUE,
  metrics_snapshot      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_passport_farmer ON public.underwriting_passports(farmer_id);
CREATE INDEX idx_passport_cycle ON public.underwriting_passports(crop_cycle_id, created_at DESC);

ALTER TABLE public.underwriting_passports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers read own underwriting passports" ON public.underwriting_passports
  FOR SELECT TO authenticated
  USING (farmer_id = auth.uid() OR public.is_admin());

REVOKE ALL ON public.underwriting_passports FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.underwriting_passports FROM authenticated;
GRANT SELECT ON public.underwriting_passports TO authenticated;

-- Generates and seals an underwriting passport for a farmer's growing crop cycle.
CREATE OR REPLACE FUNCTION public.generate_underwriting_passport(p_cycle_id UUID)
RETURNS public.underwriting_passports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cycle public.crop_cycles%ROWTYPE;
  v_farm public.farms%ROWTYPE;
  v_telemetry RECORD;
  v_score INT;
  v_tier TEXT;
  v_credit NUMERIC;
  v_coverage NUMERIC;
  v_ndvi_stability NUMERIC;
  v_hazard NUMERIC;
  v_hash TEXT;
  v_passport public.underwriting_passports%ROWTYPE;
  v_est_value NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000'; END IF;

  SELECT * INTO v_cycle FROM public.crop_cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'CYCLE_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;

  SELECT * INTO v_farm FROM public.farms WHERE id = v_cycle.farm_id;
  IF v_farm.user_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501';
  END IF;

  -- Telemetry aggregation
  SELECT
    coalesce(avg(ndvi_score), 0.76) AS avg_ndvi,
    coalesce(stddev(ndvi_score), 0.04) AS std_ndvi,
    coalesce(avg(fungal_risk_factor), 0.12) AS avg_fungal,
    coalesce(sum(rainfall_mm), 130.0) AS total_rain,
    count(*) AS points
  INTO v_telemetry
  FROM public.telemetry_logs
  WHERE crop_cycle_id = p_cycle_id;

  -- NDVI stability: 1.0 is perfectly stable, drops with high variance or low NDVI
  v_ndvi_stability := round(greatest(0.1, least(1.0, v_telemetry.avg_ndvi - (v_telemetry.std_ndvi * 1.5)))::numeric, 3);
  -- Hazard index based on fungal risk & rainfall deviations
  v_hazard := round(least(1.0, (v_telemetry.avg_fungal * 0.7) + (CASE WHEN v_telemetry.total_rain > 300 THEN 0.3 ELSE 0.05 END))::numeric, 3);

  -- Deterministic Agricultural Credit Score calculation (300 to 850)
  v_score := round(
    300 +
    (coalesce(v_cycle.ai_confidence_score, 80) * 2.5) +
    (v_ndvi_stability * 250) -
    (v_hazard * 150)
  );
  v_score := greatest(300, least(850, v_score));

  -- Assign Tier
  IF v_score >= 780 THEN v_tier := 'AAA';
  ELSIF v_score >= 720 THEN v_tier := 'AA';
  ELSIF v_score >= 650 THEN v_tier := 'A';
  ELSIF v_score >= 580 THEN v_tier := 'BBB';
  ELSE v_tier := 'HIGH_RISK';
  END IF;

  -- Estimated harvest value benchmark (~40 BDT/kg base crop commodity)
  v_est_value := coalesce(v_cycle.ai_predicted_yield_kg, 5000) * 40;

  -- Max advance loan (up to 60% of expected yield for AAA, scaled down by score)
  v_credit := round(v_est_value * (v_score / 850.0) * 0.6, 2);
  -- Parametric insurance coverage limit (up to 80% of harvest value)
  v_coverage := round(v_est_value * 0.8, 2);

  v_hash := encode(sha256(convert_to(
    concat_ws('|', v_farm.id, v_cycle.id, v_score, v_tier, v_credit, now()),
    'UTF8')), 'hex');

  INSERT INTO public.underwriting_passports (
    farmer_id, crop_cycle_id, risk_tier, credit_score, max_eligible_credit,
    parametric_coverage, ndvi_stability_index, weather_hazard_index,
    passport_hash, metrics_snapshot
  )
  VALUES (
    v_farm.user_id, p_cycle_id, v_tier, v_score, v_credit,
    v_coverage, v_ndvi_stability, v_hazard, v_hash,
    jsonb_build_object(
      'crop_type', v_cycle.crop_type,
      'predicted_yield_kg', v_cycle.ai_predicted_yield_kg,
      'confidence_score', v_cycle.ai_confidence_score,
      'avg_ndvi', round(v_telemetry.avg_ndvi::numeric, 3),
      'avg_fungal_risk', round(v_telemetry.avg_fungal::numeric, 3),
      'total_rainfall_mm', round(v_telemetry.total_rain::numeric, 1)
    )
  )
  RETURNING * INTO v_passport;

  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'FINANCING_PASSPORT_GENERATED', 'underwriting_passport', v_passport.id,
          jsonb_build_object('score', v_score, 'tier', v_tier, 'max_credit', v_credit));

  RETURN v_passport;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_underwriting_passport(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_underwriting_passport(UUID) TO authenticated;
