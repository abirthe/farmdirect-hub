-- IoT Sensor integration: field hardware probes (Soil moisture, NPK, pH) feeding live telemetry.
-- Rollback:
--   DROP FUNCTION IF EXISTS public.ingest_sensor_telemetry(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC);
--   DROP FUNCTION IF EXISTS public.register_sensor_device(UUID, TEXT, TEXT);
--   DROP TABLE IF EXISTS public.sensor_devices;
--   ALTER TABLE public.telemetry_logs DROP COLUMN IF EXISTS npk_nitrogen, DROP COLUMN IF EXISTS npk_phosphorus,
--     DROP COLUMN IF EXISTS npk_potassium, DROP COLUMN IF EXISTS soil_ph, DROP COLUMN IF EXISTS source;

ALTER TABLE public.telemetry_logs
  ADD COLUMN IF NOT EXISTS npk_nitrogen NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS npk_phosphorus NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS npk_potassium NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS soil_ph NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'SATELLITE';

CREATE TABLE IF NOT EXISTS public.sensor_devices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_cycle_id   UUID NOT NULL REFERENCES public.crop_cycles(id) ON DELETE CASCADE,
  device_serial   TEXT NOT NULL UNIQUE,
  device_type     TEXT NOT NULL CHECK (device_type IN ('SOIL_PROBE_NPK', 'WEATHER_STATION', 'LEAF_WETNESS_SENSOR')),
  battery_level   INTEGER NOT NULL DEFAULT 100 CHECK (battery_level BETWEEN 0 AND 100),
  last_ping       TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'OFFLINE', 'CALIBRATING')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sensor_cycle ON public.sensor_devices(crop_cycle_id);

ALTER TABLE public.sensor_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers and admins read sensor devices" ON public.sensor_devices
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.crop_cycles c
      JOIN public.farms f ON f.id = c.farm_id
      WHERE c.id = sensor_devices.crop_cycle_id AND f.user_id = auth.uid()
    )
  );

REVOKE ALL ON public.sensor_devices FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.sensor_devices FROM authenticated;
GRANT SELECT ON public.sensor_devices TO authenticated;

-- Registers an IoT probe device to a farmer's crop cycle.
CREATE OR REPLACE FUNCTION public.register_sensor_device(
  p_cycle_id      UUID,
  p_device_serial TEXT,
  p_device_type   TEXT
)
RETURNS public.sensor_devices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cycle public.crop_cycles%ROWTYPE;
  v_farm public.farms%ROWTYPE;
  v_device public.sensor_devices%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000'; END IF;

  SELECT * INTO v_cycle FROM public.crop_cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'CYCLE_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;

  SELECT * INTO v_farm FROM public.farms WHERE id = v_cycle.farm_id;
  IF v_farm.user_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.sensor_devices (crop_cycle_id, device_serial, device_type)
  VALUES (p_cycle_id, trim(p_device_serial), p_device_type)
  RETURNING * INTO v_device;

  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'IOT_DEVICE_REGISTERED', 'sensor_device', v_device.id,
          jsonb_build_object('serial', p_device_serial, 'type', p_device_type));

  RETURN v_device;
END;
$$;

-- Ingests hardware telemetry and derives environmental risk indicators.
CREATE OR REPLACE FUNCTION public.ingest_sensor_telemetry(
  p_cycle_id      UUID,
  p_device_serial TEXT,
  p_moisture      NUMERIC,
  p_temp          NUMERIC,
  p_rain          NUMERIC,
  p_n             NUMERIC,
  p_p             NUMERIC,
  p_k             NUMERIC,
  p_ph            NUMERIC
)
RETURNS public.telemetry_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_device public.sensor_devices%ROWTYPE;
  v_cycle public.crop_cycles%ROWTYPE;
  v_farm public.farms%ROWTYPE;
  v_fungal NUMERIC;
  v_ndvi NUMERIC;
  v_log public.telemetry_logs%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000'; END IF;

  SELECT * INTO v_device FROM public.sensor_devices WHERE device_serial = p_device_serial;
  IF NOT FOUND THEN RAISE EXCEPTION 'DEVICE_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;

  SELECT * INTO v_cycle FROM public.crop_cycles WHERE id = p_cycle_id;
  SELECT * INTO v_farm FROM public.farms WHERE id = v_cycle.farm_id;
  IF v_farm.user_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501';
  END IF;

  -- Fungal risk calculation based on soil moisture and temperature window (24-32C is prime fungal temperature)
  v_fungal := round(least(1.0, greatest(0.05, (p_moisture * 0.007) + (CASE WHEN p_temp BETWEEN 24 AND 32 THEN 0.25 ELSE 0.05 END)))::numeric, 3);
  -- Estimated NDVI proxy: correlated with nitrogen availability and moisture
  v_ndvi := round(least(0.95, greatest(0.35, 0.45 + (p_n * 0.003) + (p_moisture * 0.004)))::numeric, 4);

  INSERT INTO public.telemetry_logs (
    crop_cycle_id, date_logged, ndvi_score, avg_temp_celsius, rainfall_mm,
    soil_moisture_percent, fungal_risk_factor, npk_nitrogen, npk_phosphorus,
    npk_potassium, soil_ph, source
  )
  VALUES (
    p_cycle_id, CURRENT_DATE, v_ndvi, p_temp, p_rain,
    p_moisture, v_fungal, p_n, p_p, p_k, p_ph, 'IOT_SENSOR'
  )
  RETURNING * INTO v_log;

  -- Update device last ping and battery simulation
  UPDATE public.sensor_devices
  SET last_ping = now(), battery_level = greatest(10, battery_level - 1)
  WHERE id = v_device.id;

  RETURN v_log;
END;
$$;

REVOKE ALL ON FUNCTION public.register_sensor_device(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ingest_sensor_telemetry(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.register_sensor_device(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ingest_sensor_telemetry(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC) TO authenticated;
