-- Migration: 20261010033000_harden_security_definer_rpcs.sql
-- Description: Hardens database RPCs against Supabase Database Linter security warnings:
-- 1. Fixes 0028_anon_security_definer_function_executable:
--    Revokes execution from `anon` & `PUBLIC` on cancel_unpaid_order, submit_bkash_payment, and verify_bkash_payment.
-- 2. Implements missing record_audit_entry helper used by KYC and commodity report services.
-- 3. Adds schema `extensions` to search_path for place_order and dispatch_shipment so gen_random_bytes() resolves cleanly.
-- 4. Ensures least privilege: only authenticated role and service_role can execute internal mutation RPCs.

-- ============================================================================
-- 1. CREATE MISSING record_audit_entry HELPER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.record_audit_entry(
  p_action TEXT,
  p_entity TEXT,
  p_entity_id UUID,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (
    coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    p_action,
    p_entity,
    p_entity_id,
    coalesce(p_details, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_audit_entry(TEXT, TEXT, UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_audit_entry(TEXT, TEXT, UUID, JSONB) TO authenticated, service_role;

-- ============================================================================
-- 2. FIX PLACE_ORDER SEARCH_PATH FOR EXTENSIONS (gen_random_bytes)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.place_order(p_listing_id UUID, p_qty NUMERIC)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_farmer  UUID;
  v_buyer   public.users%ROWTYPE;
  v_order   public.orders%ROWTYPE;
  v_total   NUMERIC;
  v_bps     INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000'; END IF;
  IF p_qty IS NULL OR p_qty <= 0 THEN RAISE EXCEPTION 'INVALID_QUANTITY' USING ERRCODE = '22023'; END IF;

  SELECT * INTO v_buyer FROM public.users WHERE id = auth.uid();
  IF v_buyer.role <> 'BUYER' OR v_buyer.status = 'SUSPENDED' THEN
    RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND OR v_listing.status <> 'ACTIVE' THEN RAISE EXCEPTION 'LISTING_UNAVAILABLE' USING ERRCODE = 'P0002'; END IF;
  IF p_qty > v_listing.quantity_tons THEN RAISE EXCEPTION 'INSUFFICIENT_STOCK' USING ERRCODE = '22023'; END IF;

  SELECT f.user_id INTO v_farmer FROM public.farms f
    JOIN public.crop_cycles c ON c.farm_id = f.id WHERE c.id = v_listing.crop_cycle_id;
  IF v_farmer = auth.uid() THEN RAISE EXCEPTION 'SELF_PURCHASE' USING ERRCODE = '42501'; END IF;

  UPDATE public.listings
    SET quantity_tons = quantity_tons - p_qty,
        status = CASE WHEN quantity_tons - p_qty = 0 THEN 'SOLD_OUT'::listing_status ELSE status END
    WHERE id = v_listing.id;

  v_total := round(p_qty * v_listing.floor_price_per_ton, 2);
  v_bps := public.compute_platform_fee_bps(v_total);

  INSERT INTO public.orders (listing_id, buyer_id, farmer_id, qty_purchased, total_price,
                             platform_fee_bps, platform_fee, qr_delivery_hash)
  VALUES (v_listing.id, auth.uid(), v_farmer, p_qty, v_total,
          v_bps, round(v_total * v_bps / 10000, 2), encode(gen_random_bytes(24), 'hex'))
  RETURNING * INTO v_order;

  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'ORDER_PLACED', 'order', v_order.id,
          jsonb_build_object('qty', p_qty, 'total', v_order.total_price, 'fee_bps', v_bps));
  INSERT INTO public.notifications (user_id, title, body, icon_type)
  VALUES (v_farmer, 'New order', 'A buyer placed an order on your listing.', 'order');
  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.place_order(UUID, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(UUID, NUMERIC) TO authenticated, service_role;

-- ============================================================================
-- 3. FIX DISPATCH_SHIPMENT SEARCH_PATH FOR EXTENSIONS (gen_random_bytes)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.dispatch_shipment(
  p_order_id      UUID,
  p_carrier       TEXT,
  p_driver_name   TEXT DEFAULT NULL,
  p_vehicle       TEXT DEFAULT NULL
)
RETURNS public.shipments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_tracking TEXT;
  v_shipment public.shipments%ROWTYPE;
  v_init_lat NUMERIC(9,6);
  v_init_lng NUMERIC(9,6);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000'; END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;

  IF v_order.farmer_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '42501';
  END IF;

  IF v_order.status NOT IN ('ESCROW_LOCKED', 'IN_TRANSIT') THEN
    RAISE EXCEPTION 'ORDER_NOT_READY: Shipment requires confirmed escrow lock (status: %)', v_order.status USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM public.shipments WHERE order_id = p_order_id AND status <> 'DELIVERED') THEN
    RAISE EXCEPTION 'ACTIVE_SHIPMENT_EXISTS' USING ERRCODE = '23505';
  END IF;

  v_init_lat := 23.8103;
  v_init_lng := 90.4125;
  BEGIN
    SELECT
      coalesce(nullif((f.boundary_coordinates->0->>0), '')::numeric, 23.8103),
      coalesce(nullif((f.boundary_coordinates->0->>1), '')::numeric, 90.4125)
    INTO v_init_lat, v_init_lng
    FROM public.listings l
    JOIN public.crop_cycles c ON c.id = l.crop_cycle_id
    JOIN public.farms f ON f.id = c.farm_id
    WHERE l.id = v_order.listing_id;
  EXCEPTION WHEN OTHERS THEN
    v_init_lat := 23.8103;
    v_init_lng := 90.4125;
  END;

  v_tracking := 'AGRO-3PL-' || upper(substring(encode(gen_random_bytes(4), 'hex') from 1 for 8));

  INSERT INTO public.shipments (
    order_id, carrier_name, tracking_number, driver_name, vehicle_registration,
    status, current_lat, current_lng, waypoints
  )
  VALUES (
    p_order_id, p_carrier, v_tracking, p_driver_name, p_vehicle,
    'IN_TRANSIT', v_init_lat, v_init_lng,
    jsonb_build_array(jsonb_build_object(
      'lat', v_init_lat,
      'lng', v_init_lng,
      'status', 'PICKED_UP',
      'timestamp', now(),
      'note', 'Cargo transferred to ' || p_carrier
    ))
  )
  RETURNING * INTO v_shipment;

  UPDATE public.orders
  SET status = 'IN_TRANSIT'::order_status, updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'SHIPMENT_DISPATCHED', 'shipment', v_shipment.id,
          jsonb_build_object('carrier', p_carrier, 'tracking', v_tracking));

  INSERT INTO public.notifications (user_id, title, body, icon_type)
  VALUES (v_order.buyer_id, 'Shipment In Transit', 'Your order is on the way via ' || p_carrier || ' (' || v_tracking || ').', 'shipping');

  RETURN v_shipment;
END;
$$;

REVOKE ALL ON FUNCTION public.dispatch_shipment(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dispatch_shipment(UUID, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- ============================================================================
-- 4. REVOKE ANON PRIVILEGES ON RECENT BKASH & ORDER CANCELLATION RPCS
-- ============================================================================
-- Function: cancel_unpaid_order(p_order_id uuid)
REVOKE ALL ON FUNCTION public.cancel_unpaid_order(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_unpaid_order(UUID) TO authenticated, service_role;

-- Function: submit_bkash_payment(p_order_id uuid, p_sender_number text, p_trx_id text)
REVOKE ALL ON FUNCTION public.submit_bkash_payment(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_bkash_payment(UUID, TEXT, TEXT) TO authenticated, service_role;

-- Function: verify_bkash_payment(p_order_id uuid, p_approved boolean, p_note text)
REVOKE ALL ON FUNCTION public.verify_bkash_payment(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_bkash_payment(UUID, BOOLEAN, TEXT) TO authenticated, service_role;
