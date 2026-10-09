-- Migration: 20261009010000_fix_database_linter_warnings.sql
-- Fix database linter warnings:
-- 1. function_search_path_mutable: Fix update_updated_at_column search_path
-- 2. extension_in_public & PostGIS SECURITY DEFINER functions:
--    - Move postgis to extensions schema (drop & recreate in extensions schema)
--    - Revoke anon/public execution on PostGIS internal functions
-- 3. anon_security_definer_function_executable & authenticated_security_definer_function_executable:
--    - Revoke execute from anon & authenticated on internal functions (handle_new_user, rls_auto_enable)
--    - Switch helper functions to SECURITY INVOKER where appropriate (is_admin)
--    - Set immutable search_path on all functions

-- ROLLBACK NOTE:
-- CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;
-- ALTER FUNCTION public.update_updated_at_column() RESET search_path;

-- ============================================================================
-- 1. FIX EXTENSION IN PUBLIC & POSTGIS ST_ESTIMATEDEXTENT FUNCTIONS
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- PostGIS does not support 'ALTER EXTENSION postgis SET SCHEMA'.
-- None of the tables use PostGIS data types (farms uses JSONB boundary_coordinates).
-- Drop extension from public and install in extensions schema cleanly.
DROP EXTENSION IF EXISTS postgis CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Revoke anon execution on PostGIS functions in extensions schema
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA extensions FROM PUBLIC, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO authenticated, service_role;

-- Revoke anon execution on st_estimatedextent if any function was installed or remains in public
DO $$
BEGIN
  REVOKE ALL ON FUNCTION public.st_estimatedextent(text, text) FROM PUBLIC, anon;
  REVOKE ALL ON FUNCTION public.st_estimatedextent(text, text, text) FROM PUBLIC, anon;
  REVOKE ALL ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM PUBLIC, anon;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ============================================================================
-- 2. FIX FUNCTION SEARCH PATH MUTABLE: update_updated_at_column
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;

-- Revoke execute from public/anon/authenticated on trigger function
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role, postgres;

-- ============================================================================
-- 3. FIX is_admin(): Switch from SECURITY DEFINER to SECURITY INVOKER
--    (Users query their own record via RLS; SECURITY DEFINER is not needed)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ADMIN' AND status <> 'SUSPENDED'
  );
$$;

-- Deny anon access; allow authenticated users to check their own role
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- ============================================================================
-- 4. FIX handle_new_user(): Internal auth trigger must NOT be callable via PostgREST RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  requested TEXT := upper(coalesce(new.raw_user_meta_data->>'role', 'FARMER'));
BEGIN
  INSERT INTO public.users (id, full_name, role)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'AgroDirect User'),
    CASE WHEN requested = 'BUYER' THEN 'BUYER'::user_role ELSE 'FARMER'::user_role END
  );
  RETURN new;
END;
$$;

-- Revoke execution from PUBLIC, anon, authenticated so it cannot be invoked as an RPC endpoint
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role, postgres;

-- ============================================================================
-- 5. FIX rls_auto_enable() if it exists: Revoke execution from anon & authenticated
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role, postgres';
  END IF;
END $$;

-- ============================================================================
-- 6. SET IMMUTABLE search_path = public, pg_temp ON CORE BUSINESS RPCS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.place_order(p_listing_id UUID, p_qty NUMERIC)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_farmer  UUID;
  v_buyer   public.users%ROWTYPE;
  v_order   public.orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000'; END IF;
  IF p_qty IS NULL OR p_qty <= 0 THEN RAISE EXCEPTION 'INVALID_QUANTITY' USING ERRCODE = '22023'; END IF;

  SELECT * INTO v_buyer FROM public.users WHERE id = auth.uid();
  IF v_buyer.role <> 'BUYER' OR v_buyer.status = 'SUSPENDED' THEN
    RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501';
  END IF;

  -- Row lock prevents overselling under concurrent requests
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

  INSERT INTO public.orders (listing_id, buyer_id, farmer_id, qty_purchased, total_price, qr_delivery_hash)
  VALUES (v_listing.id, auth.uid(), v_farmer, p_qty, round(p_qty * v_listing.floor_price_per_ton, 2),
          encode(gen_random_bytes(24), 'hex'))
  RETURNING * INTO v_order;

  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'ORDER_PLACED', 'order', v_order.id, jsonb_build_object('qty', p_qty, 'total', v_order.total_price));
  INSERT INTO public.notifications (user_id, title, body, icon_type)
  VALUES (v_farmer, 'New order', 'A buyer placed an order on your listing.', 'order');
  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.transition_order(p_order_id UUID, p_new_status public.order_status)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_uid   UUID := auth.uid();
  v_admin BOOLEAN := public.is_admin();
  v_service BOOLEAN := coalesce(auth.role(), '') = 'service_role';
  v_allowed BOOLEAN := FALSE;
BEGIN
  IF v_uid IS NULL AND NOT v_service THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000'; END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;

  v_allowed := CASE
    WHEN v_order.status = 'INITIATED'     AND p_new_status = 'ESCROW_LOCKED' THEN v_admin OR v_service
    WHEN v_order.status = 'ESCROW_LOCKED' AND p_new_status = 'IN_TRANSIT'    THEN v_uid = v_order.farmer_id
    WHEN v_order.status = 'IN_TRANSIT'    AND p_new_status = 'DELIVERED'     THEN v_uid = v_order.buyer_id
    WHEN v_order.status = 'DELIVERED'     AND p_new_status = 'RELEASED'      THEN v_uid = v_order.buyer_id OR v_admin
    WHEN v_order.status IN ('ESCROW_LOCKED','IN_TRANSIT','DELIVERED') AND p_new_status = 'DISPUTED'
                                                                             THEN v_uid = v_order.buyer_id
    WHEN v_order.status = 'DISPUTED'      AND p_new_status = 'RELEASED'      THEN v_admin
    ELSE FALSE END;

  IF NOT v_allowed THEN RAISE EXCEPTION 'ILLEGAL_TRANSITION' USING ERRCODE = '42501'; END IF;

  UPDATE public.orders
    SET status = p_new_status,
        delivered_at = CASE WHEN p_new_status = 'DELIVERED' THEN now() ELSE delivered_at END
    WHERE id = p_order_id RETURNING * INTO v_order;

  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (v_uid, 'ORDER_' || p_new_status::text, 'order', p_order_id, '{}'::jsonb);
  INSERT INTO public.notifications (user_id, title, body, icon_type)
  SELECT u, 'Order update', 'Order status is now ' || p_new_status::text, 'order'
  FROM unnest(ARRAY[v_order.buyer_id, v_order.farmer_id]) AS u WHERE u IS DISTINCT FROM v_uid;
  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_status(p_user_id UUID, p_status public.platform_status)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_user public.users%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501'; END IF;
  UPDATE public.users SET status = p_status WHERE id = p_user_id RETURNING * INTO v_user;
  IF NOT FOUND THEN RAISE EXCEPTION 'USER_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'USER_STATUS_SET', 'user', p_user_id, jsonb_build_object('status', p_status));
  RETURN v_user;
END;
$$;

-- Revoke anon on all business RPCs explicitly
REVOKE ALL ON FUNCTION public.place_order(UUID, NUMERIC) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.transition_order(UUID, public.order_status) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_user_status(UUID, public.platform_status) FROM PUBLIC, anon;

-- Grant authenticated where needed
GRANT EXECUTE ON FUNCTION public.place_order(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_order(UUID, public.order_status) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(UUID, public.platform_status) TO authenticated, service_role;
