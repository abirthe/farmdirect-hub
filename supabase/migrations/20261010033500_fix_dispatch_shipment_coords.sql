-- Migration: 20261010033500_fix_dispatch_shipment_coords.sql
-- Description: Corrects dispatch_shipment coordinate extraction to safely query boundary_coordinates from farms.

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
