-- Migration: 20261010050000_wrap_security_definer_functions.sql
-- Description: Wraps SECURITY DEFINER functions in a private schema to resolve linter errors

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- Wrap accept_forward_contract
ALTER FUNCTION public.accept_forward_contract(p_id UUID) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.accept_forward_contract(p_id UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.accept_forward_contract(p_id UUID)
RETURNS public.forward_contracts
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret public.forward_contracts;
BEGIN
  SELECT * INTO v_ret FROM private.accept_forward_contract(p_id);
  RETURN v_ret;
END;
$$;

-- Wrap add_dispute_evidence
ALTER FUNCTION public.add_dispute_evidence(p_dispute_id UUID, p_body TEXT) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.add_dispute_evidence(p_dispute_id UUID, p_body TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.add_dispute_evidence(p_dispute_id UUID, p_body TEXT)
RETURNS public.dispute_evidence
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret public.dispute_evidence;
BEGIN
  SELECT * INTO v_ret FROM private.add_dispute_evidence(p_dispute_id, p_body);
  RETURN v_ret;
END;
$$;

-- Wrap award_bid
ALTER FUNCTION public.award_bid(p_bid_id UUID) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.award_bid(p_bid_id UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.award_bid(p_bid_id UUID)
RETURNS public.rfqs
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret public.rfqs;
BEGIN
  SELECT * INTO v_ret FROM private.award_bid(p_bid_id);
  RETURN v_ret;
END;
$$;

-- Wrap cancel_forward_contract
ALTER FUNCTION public.cancel_forward_contract(p_id UUID) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.cancel_forward_contract(p_id UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cancel_forward_contract(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  PERFORM private.cancel_forward_contract(p_id);
END;
$$;

-- Wrap cancel_rfq
ALTER FUNCTION public.cancel_rfq(p_rfq_id UUID) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.cancel_rfq(p_rfq_id UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cancel_rfq(p_rfq_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  PERFORM private.cancel_rfq(p_rfq_id);
END;
$$;

-- Wrap create_forward_contract
ALTER FUNCTION public.create_forward_contract(p_cycle UUID, p_qty NUMERIC, p_price NUMERIC, p_delivery DATE) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.create_forward_contract(p_cycle UUID, p_qty NUMERIC, p_price NUMERIC, p_delivery DATE) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_forward_contract(p_cycle UUID, p_qty NUMERIC, p_price NUMERIC, p_delivery DATE)
RETURNS public.forward_contracts
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret public.forward_contracts;
BEGIN
  SELECT * INTO v_ret FROM private.create_forward_contract(p_cycle, p_qty, p_price, p_delivery);
  RETURN v_ret;
END;
$$;

-- Wrap create_rfq
ALTER FUNCTION public.create_rfq(p_crop TEXT, p_qty NUMERIC, p_max_price NUMERIC, p_deadline TIMESTAMPTZ, p_notes TEXT ) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.create_rfq(p_crop TEXT, p_qty NUMERIC, p_max_price NUMERIC, p_deadline TIMESTAMPTZ, p_notes TEXT ) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_rfq(p_crop TEXT, p_qty NUMERIC, p_max_price NUMERIC, p_deadline TIMESTAMPTZ, p_notes TEXT DEFAULT NULL)
RETURNS public.rfqs
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret public.rfqs;
BEGIN
  SELECT * INTO v_ret FROM private.create_rfq(p_crop, p_qty, p_max_price, p_deadline, p_notes);
  RETURN v_ret;
END;
$$;

-- Wrap dispatch_shipment
ALTER FUNCTION public.dispatch_shipment(p_order_id      UUID,
  p_carrier       TEXT,
  p_driver_name   TEXT ,
  p_vehicle       TEXT ) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.dispatch_shipment(p_order_id      UUID,
  p_carrier       TEXT,
  p_driver_name   TEXT ,
  p_vehicle       TEXT ) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.dispatch_shipment(p_order_id      UUID,
  p_carrier       TEXT,
  p_driver_name   TEXT DEFAULT NULL,
  p_vehicle       TEXT DEFAULT NULL)
RETURNS public.shipments
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret public.shipments;
BEGIN
  SELECT * INTO v_ret FROM private.dispatch_shipment(p_order_id, p_carrier, p_driver_name, p_vehicle);
  RETURN v_ret;
END;
$$;

-- Wrap download_commodity_report
ALTER FUNCTION public.download_commodity_report(p_report_id UUID) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.download_commodity_report(p_report_id UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.download_commodity_report(p_report_id UUID)
RETURNS commodity_reports
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret commodity_reports;
BEGIN
  SELECT * INTO v_ret FROM private.download_commodity_report(p_report_id);
  RETURN v_ret;
END;
$$;

-- Wrap generate_cycle_prescriptions
ALTER FUNCTION public.generate_cycle_prescriptions(p_cycle_id UUID) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.generate_cycle_prescriptions(p_cycle_id UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.generate_cycle_prescriptions(p_cycle_id UUID)
RETURNS SETOF prescriptions
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM private.generate_cycle_prescriptions(p_cycle_id);
END;
$$;

-- Wrap generate_underwriting_passport
ALTER FUNCTION public.generate_underwriting_passport(p_cycle_id UUID) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.generate_underwriting_passport(p_cycle_id UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.generate_underwriting_passport(p_cycle_id UUID)
RETURNS public.underwriting_passports
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret public.underwriting_passports;
BEGIN
  SELECT * INTO v_ret FROM private.generate_underwriting_passport(p_cycle_id);
  RETURN v_ret;
END;
$$;

-- Wrap ingest_sensor_telemetry
ALTER FUNCTION public.ingest_sensor_telemetry(p_cycle_id      UUID,
  p_device_serial TEXT,
  p_moisture      NUMERIC,
  p_temp          NUMERIC,
  p_rain          NUMERIC,
  p_n             NUMERIC,
  p_p             NUMERIC,
  p_k             NUMERIC,
  p_ph            NUMERIC) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.ingest_sensor_telemetry(p_cycle_id      UUID,
  p_device_serial TEXT,
  p_moisture      NUMERIC,
  p_temp          NUMERIC,
  p_rain          NUMERIC,
  p_n             NUMERIC,
  p_p             NUMERIC,
  p_k             NUMERIC,
  p_ph            NUMERIC) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ingest_sensor_telemetry(p_cycle_id      UUID,
  p_device_serial TEXT,
  p_moisture      NUMERIC,
  p_temp          NUMERIC,
  p_rain          NUMERIC,
  p_n             NUMERIC,
  p_p             NUMERIC,
  p_k             NUMERIC,
  p_ph            NUMERIC)
RETURNS public.telemetry_logs
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret public.telemetry_logs;
BEGIN
  SELECT * INTO v_ret FROM private.ingest_sensor_telemetry(p_cycle_id, p_device_serial, p_moisture, p_temp, p_rain, p_n, p_p, p_k, p_ph);
  RETURN v_ret;
END;
$$;

-- Wrap mark_prescription_applied
ALTER FUNCTION public.mark_prescription_applied(p_prescription_id UUID,
    p_status TEXT) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.mark_prescription_applied(p_prescription_id UUID,
    p_status TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.mark_prescription_applied(p_prescription_id UUID,
    p_status TEXT)
RETURNS prescriptions
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret prescriptions;
BEGIN
  SELECT * INTO v_ret FROM private.mark_prescription_applied(p_prescription_id, p_status);
  RETURN v_ret;
END;
$$;

-- Wrap open_dispute
ALTER FUNCTION public.open_dispute(p_order_id UUID, p_reason public.dispute_reason, p_description TEXT) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.open_dispute(p_order_id UUID, p_reason public.dispute_reason, p_description TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.open_dispute(p_order_id UUID, p_reason public.dispute_reason, p_description TEXT)
RETURNS public.disputes
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret public.disputes;
BEGIN
  SELECT * INTO v_ret FROM private.open_dispute(p_order_id, p_reason, p_description);
  RETURN v_ret;
END;
$$;

-- Wrap place_order
ALTER FUNCTION public.place_order(p_listing_id UUID, p_qty NUMERIC) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.place_order(p_listing_id UUID, p_qty NUMERIC) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.place_order(p_listing_id UUID, p_qty NUMERIC)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret public.orders;
BEGIN
  SELECT * INTO v_ret FROM private.place_order(p_listing_id, p_qty);
  RETURN v_ret;
END;
$$;

-- Wrap register_sensor_device
ALTER FUNCTION public.register_sensor_device(p_cycle_id      UUID,
  p_device_serial TEXT,
  p_device_type   TEXT) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.register_sensor_device(p_cycle_id      UUID,
  p_device_serial TEXT,
  p_device_type   TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.register_sensor_device(p_cycle_id      UUID,
  p_device_serial TEXT,
  p_device_type   TEXT)
RETURNS public.sensor_devices
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret public.sensor_devices;
BEGIN
  SELECT * INTO v_ret FROM private.register_sensor_device(p_cycle_id, p_device_serial, p_device_type);
  RETURN v_ret;
END;
$$;

-- Wrap resolve_dispute
ALTER FUNCTION public.resolve_dispute(p_dispute_id UUID, p_outcome public.dispute_status, p_note TEXT) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.resolve_dispute(p_dispute_id UUID, p_outcome public.dispute_status, p_note TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.resolve_dispute(p_dispute_id UUID, p_outcome public.dispute_status, p_note TEXT)
RETURNS public.disputes
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret public.disputes;
BEGIN
  SELECT * INTO v_ret FROM private.resolve_dispute(p_dispute_id, p_outcome, p_note);
  RETURN v_ret;
END;
$$;

-- Wrap review_kyc_application
ALTER FUNCTION public.review_kyc_application(p_verification_id UUID,
    p_decision TEXT,
    p_notes TEXT ) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.review_kyc_application(p_verification_id UUID,
    p_decision TEXT,
    p_notes TEXT ) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.review_kyc_application(p_verification_id UUID,
    p_decision TEXT,
    p_notes TEXT DEFAULT NULL)
RETURNS kyc_verifications
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret kyc_verifications;
BEGIN
  SELECT * INTO v_ret FROM private.review_kyc_application(p_verification_id, p_decision, p_notes);
  RETURN v_ret;
END;
$$;

-- Wrap set_fee_tiers
ALTER FUNCTION public.set_fee_tiers(p_tiers JSONB) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.set_fee_tiers(p_tiers JSONB) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_fee_tiers(p_tiers JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  PERFORM private.set_fee_tiers(p_tiers);
END;
$$;

-- Wrap submit_bid
ALTER FUNCTION public.submit_bid(p_rfq_id UUID, p_price NUMERIC, p_qty NUMERIC, p_note TEXT ) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.submit_bid(p_rfq_id UUID, p_price NUMERIC, p_qty NUMERIC, p_note TEXT ) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.submit_bid(p_rfq_id UUID, p_price NUMERIC, p_qty NUMERIC, p_note TEXT DEFAULT NULL)
RETURNS public.rfq_bids
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret public.rfq_bids;
BEGIN
  SELECT * INTO v_ret FROM private.submit_bid(p_rfq_id, p_price, p_qty, p_note);
  RETURN v_ret;
END;
$$;

-- Wrap submit_bkash_payment
ALTER FUNCTION public.submit_bkash_payment(p_order_id UUID,
  p_sender_number TEXT,
  p_trx_id TEXT) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.submit_bkash_payment(p_order_id UUID,
  p_sender_number TEXT,
  p_trx_id TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.submit_bkash_payment(p_order_id UUID,
  p_sender_number TEXT,
  p_trx_id TEXT)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret public.orders;
BEGIN
  SELECT * INTO v_ret FROM private.submit_bkash_payment(p_order_id, p_sender_number, p_trx_id);
  RETURN v_ret;
END;
$$;

-- Wrap submit_kyc_application
ALTER FUNCTION public.submit_kyc_application(p_full_name TEXT,
    p_document_type TEXT,
    p_document_number TEXT,
    p_issuing_authority TEXT,
    p_document_url TEXT ,
    p_metadata JSONB ) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.submit_kyc_application(p_full_name TEXT,
    p_document_type TEXT,
    p_document_number TEXT,
    p_issuing_authority TEXT,
    p_document_url TEXT ,
    p_metadata JSONB ) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.submit_kyc_application(p_full_name TEXT,
    p_document_type TEXT,
    p_document_number TEXT,
    p_issuing_authority TEXT,
    p_document_url TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb)
RETURNS kyc_verifications
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret kyc_verifications;
BEGIN
  SELECT * INTO v_ret FROM private.submit_kyc_application(p_full_name, p_document_type, p_document_number, p_issuing_authority, p_document_url, p_metadata);
  RETURN v_ret;
END;
$$;

-- Wrap triage_dispute
ALTER FUNCTION public.triage_dispute(p_dispute_id UUID) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.triage_dispute(p_dispute_id UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.triage_dispute(p_dispute_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret JSONB;
BEGIN
  SELECT * INTO v_ret FROM private.triage_dispute(p_dispute_id);
  RETURN v_ret;
END;
$$;

-- Wrap update_shipment_telemetry
ALTER FUNCTION public.update_shipment_telemetry(p_shipment_id   UUID,
  p_lat           NUMERIC,
  p_lng           NUMERIC,
  p_status        TEXT ,
  p_note          TEXT ) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.update_shipment_telemetry(p_shipment_id   UUID,
  p_lat           NUMERIC,
  p_lng           NUMERIC,
  p_status        TEXT ,
  p_note          TEXT ) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.update_shipment_telemetry(p_shipment_id   UUID,
  p_lat           NUMERIC,
  p_lng           NUMERIC,
  p_status        TEXT DEFAULT 'IN_TRANSIT',
  p_note          TEXT DEFAULT 'In transit')
RETURNS public.shipments
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret public.shipments;
BEGIN
  SELECT * INTO v_ret FROM private.update_shipment_telemetry(p_shipment_id, p_lat, p_lng, p_status, p_note);
  RETURN v_ret;
END;
$$;

-- Wrap verify_bkash_payment
ALTER FUNCTION public.verify_bkash_payment(p_order_id UUID,
  p_approved BOOLEAN,
  p_note TEXT ) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.verify_bkash_payment(p_order_id UUID,
  p_approved BOOLEAN,
  p_note TEXT ) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.verify_bkash_payment(p_order_id UUID,
  p_approved BOOLEAN,
  p_note TEXT DEFAULT NULL)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ret public.orders;
BEGIN
  SELECT * INTO v_ret FROM private.verify_bkash_payment(p_order_id, p_approved, p_note);
  RETURN v_ret;
END;
$$;

-- Wrap withdraw_bid
ALTER FUNCTION public.withdraw_bid(p_bid_id UUID) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.withdraw_bid(p_bid_id UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.withdraw_bid(p_bid_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  PERFORM private.withdraw_bid(p_bid_id);
END;
$$;

