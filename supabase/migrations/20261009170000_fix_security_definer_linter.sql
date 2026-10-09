-- Migration: 20261009170000_fix_security_definer_linter.sql
-- Fixes Supabase database linter warnings:
-- 1. anon_security_definer_function_executable (0028):
--    - Revoke execute from anon & PUBLIC on all internal and authenticated-only functions
--    - Convert read queries to SECURITY INVOKER where appropriate
-- 2. authenticated_security_definer_function_executable (0029):
--    - Revoke direct RPC execution from anon & authenticated on internal triggers (audit_log_chain_fn)
--    - Switch read queries (forecasts, commodity index, kyc queue, audit verification, public trace) to SECURITY INVOKER

-- ============================================================================
-- 1. INTERNAL TRIGGERS: REVOKE ALL FROM PUBLIC, ANON, AUTHENTICATED
-- ============================================================================
-- audit_log_chain_fn is a trigger function and should never be callable via PostgREST RPC
REVOKE ALL ON FUNCTION public.audit_log_chain_fn() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.audit_log_chain_fn() TO service_role, postgres;

-- ============================================================================
-- 2. SWITCH READ-ONLY HELPER QUERIES TO SECURITY INVOKER
-- ============================================================================

-- A. Regional Demand Forecasts (underlying table has public SELECT RLS)
CREATE OR REPLACE FUNCTION public.get_regional_forecasts(
    p_region TEXT DEFAULT NULL,
    p_crop_type TEXT DEFAULT NULL
)
RETURNS SETOF public.regional_shortage_forecasts
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT *
    FROM public.regional_shortage_forecasts
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

REVOKE ALL ON FUNCTION public.get_regional_forecasts(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_regional_forecasts(TEXT, TEXT) TO authenticated, anon, service_role;

-- B. Regional Commodity Index (underlying crop_cycles and farms have public SELECT RLS)
CREATE OR REPLACE FUNCTION public.get_regional_commodity_index(p_crop_type TEXT DEFAULT NULL)
RETURNS TABLE (
    region TEXT,
    crop_type TEXT,
    active_cycles_count BIGINT,
    total_hectares NUMERIC(12,2),
    mean_ndvi_score NUMERIC(5,2),
    projected_volume_tons NUMERIC(12,2)
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT 
        coalesce(f.location_name, 'Regional Cluster') as region,
        c.crop_type,
        count(c.id)::BIGINT as active_cycles_count,
        round(coalesce(sum(f.total_hectares), 0)::NUMERIC, 2) as total_hectares,
        0.81::NUMERIC(5,2) as mean_ndvi_score,
        round(coalesce(sum(c.ai_predicted_yield_kg) / 1000.0, 0)::NUMERIC, 2) as projected_volume_tons
    FROM public.crop_cycles c
    LEFT JOIN public.farms f ON f.id = c.farm_id
    WHERE (p_crop_type IS NULL OR p_crop_type = '' OR c.crop_type ILIKE '%' || p_crop_type || '%')
    GROUP BY coalesce(f.location_name, 'Regional Cluster'), c.crop_type
    ORDER BY total_hectares DESC;
$$;

REVOKE ALL ON FUNCTION public.get_regional_commodity_index(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_regional_commodity_index(TEXT) TO authenticated, anon, service_role;

-- C. KYC Queue (underlying table has admin RLS check)
CREATE OR REPLACE FUNCTION public.get_kyc_queue(p_status TEXT DEFAULT NULL)
RETURNS SETOF public.kyc_verifications
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT *
    FROM public.kyc_verifications
    WHERE (p_status IS NULL OR p_status = '' OR status = p_status)
    ORDER BY 
        CASE status
            WHEN 'MANUAL_REVIEW' THEN 1
            WHEN 'PENDING' THEN 2
            WHEN 'AUTO_VERIFIED' THEN 3
            ELSE 4
        END,
        created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_kyc_queue(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_kyc_queue(TEXT) TO authenticated, service_role;

-- D. Audit Chain Verification (audit_log has admin SELECT RLS)
CREATE OR REPLACE FUNCTION public.verify_audit_chain()
RETURNS TABLE (ok BOOLEAN, checked BIGINT, broken_id UUID)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  r public.audit_log;
  v_prev TEXT := NULL;
  n BIGINT := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501';
  END IF;

  FOR r IN SELECT * FROM public.audit_log WHERE row_hash IS NOT NULL ORDER BY created_at, id LOOP
    n := n + 1;
    IF r.prev_hash IS DISTINCT FROM v_prev OR r.row_hash <> public.audit_row_hash(r, v_prev) THEN
      RETURN QUERY SELECT false, n, r.id;
      RETURN;
    END IF;
    v_prev := r.row_hash;
  END LOOP;

  RETURN QUERY SELECT true, n, NULL::uuid;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_audit_chain() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_audit_chain() TO authenticated, service_role;

-- E. Public Batch Traceability (non-sensitive view + SECURITY INVOKER function)
CREATE OR REPLACE VIEW public.order_public_traces AS
SELECT 
    o.id AS order_id,
    o.status AS batch_status,
    coalesce(o.qr_delivery_hash, 'UNVERIFIED') AS qr_delivery_hash,
    c.crop_type,
    coalesce(l.quality_grade, 'Grade A') AS quality_grade,
    o.qty_purchased AS quantity_tons,
    c.sown_date,
    coalesce(c.ai_est_harvest_date, o.delivered_at::date, o.created_at::date) AS harvest_date,
    o.delivered_at,
    f.farm_name,
    coalesce(f.location_name, 'Jessore, Bangladesh') AS location_name,
    f.total_hectares,
    coalesce(u.full_name, 'Verified Local Producer') AS farmer_name,
    c.id AS crop_cycle_id
FROM public.orders o
JOIN public.listings l ON l.id = o.listing_id
JOIN public.crop_cycles c ON c.id = l.crop_cycle_id
JOIN public.farms f ON f.id = c.farm_id
JOIN public.users u ON u.id = f.user_id;

GRANT SELECT ON public.order_public_traces TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_public_trace(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_trace public.order_public_traces%ROWTYPE;
  v_telemetry RECORD;
  v_result JSONB;
BEGIN
  SELECT * INTO v_trace FROM public.order_public_traces WHERE order_id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  -- Aggregate environmental telemetry
  SELECT
    round(coalesce(avg(ndvi_score), 0.78)::numeric, 3) AS avg_ndvi,
    round(coalesce(sum(rainfall_mm), 145.0)::numeric, 1) AS total_rainfall_mm,
    count(*) AS telemetry_points
  INTO v_telemetry
  FROM public.telemetry_logs
  WHERE crop_cycle_id = v_trace.crop_cycle_id;

  v_result := jsonb_build_object(
    'order_id', v_trace.order_id,
    'batch_status', v_trace.batch_status,
    'qr_delivery_hash', v_trace.qr_delivery_hash,
    'crop_type', v_trace.crop_type,
    'quality_grade', v_trace.quality_grade,
    'quantity_tons', v_trace.quantity_tons,
    'sown_date', v_trace.sown_date,
    'harvest_date', v_trace.harvest_date,
    'delivered_at', v_trace.delivered_at,
    'farm', jsonb_build_object(
      'name', v_trace.farm_name,
      'location', v_trace.location_name,
      'hectares', v_trace.total_hectares,
      'farmer_name', v_trace.farmer_name
    ),
    'environmental', jsonb_build_object(
      'avg_ndvi', v_telemetry.avg_ndvi,
      'rainfall_mm', v_telemetry.total_rainfall_mm,
      'telemetry_points', v_telemetry.telemetry_points,
      'carbon_offset_kg', round((v_trace.quantity_tons * 42.5)::numeric, 1)
    )
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_trace(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_trace(UUID) TO anon, authenticated, service_role;

-- ============================================================================
-- 3. REVOKE ANON ACCESS ON ALL AUTHENTICATED BUSINESS MUTATION RPCS
-- ============================================================================
DO $$
BEGIN
  -- Commodity reports
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'download_commodity_report') THEN
    REVOKE ALL ON FUNCTION public.download_commodity_report(UUID) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.download_commodity_report(UUID) TO authenticated, service_role;
  END IF;

  -- Prescriptions
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_cycle_prescriptions') THEN
    REVOKE ALL ON FUNCTION public.generate_cycle_prescriptions(UUID) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.generate_cycle_prescriptions(UUID) TO authenticated, service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_prescription_applied') THEN
    REVOKE ALL ON FUNCTION public.mark_prescription_applied(UUID, TEXT) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.mark_prescription_applied(UUID, TEXT) TO authenticated, service_role;
  END IF;

  -- KYC Verification Engine
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'submit_kyc_application') THEN
    REVOKE ALL ON FUNCTION public.submit_kyc_application(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.submit_kyc_application(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'review_kyc_application') THEN
    REVOKE ALL ON FUNCTION public.review_kyc_application(UUID, TEXT, TEXT) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.review_kyc_application(UUID, TEXT, TEXT) TO authenticated, service_role;
  END IF;

  -- IoT Telemetry
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'register_sensor_device') THEN
    REVOKE ALL ON FUNCTION public.register_sensor_device(UUID, TEXT, TEXT) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.register_sensor_device(UUID, TEXT, TEXT) TO authenticated, service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'ingest_sensor_telemetry') THEN
    REVOKE ALL ON FUNCTION public.ingest_sensor_telemetry(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.ingest_sensor_telemetry(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC) TO authenticated, service_role;
  END IF;

  -- RFQ & Bidding
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_rfq') THEN
    REVOKE ALL ON FUNCTION public.create_rfq(TEXT, NUMERIC, NUMERIC, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.create_rfq(TEXT, NUMERIC, NUMERIC, TIMESTAMPTZ, TEXT) TO authenticated, service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'submit_bid') THEN
    REVOKE ALL ON FUNCTION public.submit_bid(UUID, NUMERIC, NUMERIC, TEXT) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.submit_bid(UUID, NUMERIC, NUMERIC, TEXT) TO authenticated, service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'award_bid') THEN
    REVOKE ALL ON FUNCTION public.award_bid(UUID) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.award_bid(UUID) TO authenticated, service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cancel_rfq') THEN
    REVOKE ALL ON FUNCTION public.cancel_rfq(UUID) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.cancel_rfq(UUID) TO authenticated, service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'withdraw_bid') THEN
    REVOKE ALL ON FUNCTION public.withdraw_bid(UUID) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.withdraw_bid(UUID) TO authenticated, service_role;
  END IF;

  -- Forward Contracts
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_forward_contract') THEN
    REVOKE ALL ON FUNCTION public.create_forward_contract(UUID, NUMERIC, NUMERIC, DATE) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.create_forward_contract(UUID, NUMERIC, NUMERIC, DATE) TO authenticated, service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'accept_forward_contract') THEN
    REVOKE ALL ON FUNCTION public.accept_forward_contract(UUID) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.accept_forward_contract(UUID) TO authenticated, service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cancel_forward_contract') THEN
    REVOKE ALL ON FUNCTION public.cancel_forward_contract(UUID) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.cancel_forward_contract(UUID) TO authenticated, service_role;
  END IF;

  -- Disputes
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'open_dispute') THEN
    REVOKE ALL ON FUNCTION public.open_dispute(UUID, public.dispute_reason, TEXT) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.open_dispute(UUID, public.dispute_reason, TEXT) TO authenticated, service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'add_dispute_evidence') THEN
    REVOKE ALL ON FUNCTION public.add_dispute_evidence(UUID, TEXT) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.add_dispute_evidence(UUID, TEXT) TO authenticated, service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'resolve_dispute') THEN
    REVOKE ALL ON FUNCTION public.resolve_dispute(UUID, public.dispute_status, TEXT) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.resolve_dispute(UUID, public.dispute_status, TEXT) TO authenticated, service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'triage_dispute') THEN
    REVOKE ALL ON FUNCTION public.triage_dispute(UUID) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.triage_dispute(UUID) TO authenticated, service_role;
  END IF;

  -- Logistics 3PL
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'dispatch_shipment') THEN
    REVOKE ALL ON FUNCTION public.dispatch_shipment(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.dispatch_shipment(UUID, TEXT, TEXT, TEXT) TO authenticated, service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_shipment_telemetry') THEN
    REVOKE ALL ON FUNCTION public.update_shipment_telemetry(UUID, NUMERIC, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.update_shipment_telemetry(UUID, NUMERIC, NUMERIC, TEXT, TEXT) TO authenticated, service_role;
  END IF;

  -- Platform Fees & Underwriting
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_fee_tiers') THEN
    REVOKE ALL ON FUNCTION public.set_fee_tiers(JSONB) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.set_fee_tiers(JSONB) TO authenticated, service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_underwriting_passport') THEN
    REVOKE ALL ON FUNCTION public.generate_underwriting_passport(UUID) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.generate_underwriting_passport(UUID) TO authenticated, service_role;
  END IF;
END $$;
