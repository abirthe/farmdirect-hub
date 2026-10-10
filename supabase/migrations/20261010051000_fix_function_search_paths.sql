-- Migration: 20261010051000_fix_function_search_paths.sql
-- Description: Sets search_path on wrapper functions to satisfy linter

ALTER FUNCTION public.accept_forward_contract(p_id UUID) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.add_dispute_evidence(p_dispute_id UUID, p_body TEXT) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.award_bid(p_bid_id UUID) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.cancel_forward_contract(p_id UUID) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.cancel_rfq(p_rfq_id UUID) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.create_forward_contract(p_cycle UUID, p_qty NUMERIC, p_price NUMERIC, p_delivery DATE) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.create_rfq(p_crop TEXT, p_qty NUMERIC, p_max_price NUMERIC, p_deadline TIMESTAMPTZ, p_notes TEXT ) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.dispatch_shipment(p_order_id      UUID,
  p_carrier       TEXT,
  p_driver_name   TEXT ,
  p_vehicle       TEXT ) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.download_commodity_report(p_report_id UUID) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.generate_cycle_prescriptions(p_cycle_id UUID) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.generate_underwriting_passport(p_cycle_id UUID) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.ingest_sensor_telemetry(p_cycle_id      UUID,
  p_device_serial TEXT,
  p_moisture      NUMERIC,
  p_temp          NUMERIC,
  p_rain          NUMERIC,
  p_n             NUMERIC,
  p_p             NUMERIC,
  p_k             NUMERIC,
  p_ph            NUMERIC) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.mark_prescription_applied(p_prescription_id UUID,
    p_status TEXT) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.open_dispute(p_order_id UUID, p_reason public.dispute_reason, p_description TEXT) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.place_order(p_listing_id UUID, p_qty NUMERIC) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.register_sensor_device(p_cycle_id      UUID,
  p_device_serial TEXT,
  p_device_type   TEXT) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.resolve_dispute(p_dispute_id UUID, p_outcome public.dispute_status, p_note TEXT) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.review_kyc_application(p_verification_id UUID,
    p_decision TEXT,
    p_notes TEXT ) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.set_fee_tiers(p_tiers JSONB) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.submit_bid(p_rfq_id UUID, p_price NUMERIC, p_qty NUMERIC, p_note TEXT ) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.submit_bkash_payment(p_order_id UUID,
  p_sender_number TEXT,
  p_trx_id TEXT) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.submit_kyc_application(p_full_name TEXT,
    p_document_type TEXT,
    p_document_number TEXT,
    p_issuing_authority TEXT,
    p_document_url TEXT ,
    p_metadata JSONB ) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.triage_dispute(p_dispute_id UUID) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.update_shipment_telemetry(p_shipment_id   UUID,
  p_lat           NUMERIC,
  p_lng           NUMERIC,
  p_status        TEXT ,
  p_note          TEXT ) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.verify_bkash_payment(p_order_id UUID,
  p_approved BOOLEAN,
  p_note TEXT ) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.withdraw_bid(p_bid_id UUID) SET search_path = public, extensions, pg_temp;
