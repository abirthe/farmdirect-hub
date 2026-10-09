-- 3PL (Third-Party Logistics) integration and live transit tracking.
-- Rollback:
--   DROP FUNCTION IF EXISTS public.dispatch_shipment(UUID, TEXT, TEXT, TEXT);
--   DROP FUNCTION IF EXISTS public.update_shipment_telemetry(UUID, NUMERIC, NUMERIC, TEXT, TEXT);
--   DROP TABLE IF EXISTS public.shipments;

CREATE TABLE IF NOT EXISTS public.shipments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
  carrier_name        TEXT NOT NULL CHECK (char_length(carrier_name) BETWEEN 2 AND 60),
  tracking_number     TEXT NOT NULL UNIQUE,
  driver_name         TEXT,
  vehicle_plate       TEXT,
  status              TEXT NOT NULL DEFAULT 'PENDING_PICKUP'
                      CHECK (status IN ('PENDING_PICKUP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED')),
  current_lat         NUMERIC(9,6),
  current_lng         NUMERIC(9,6),
  waypoints           JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shipments_order ON public.shipments(order_id);
CREATE INDEX idx_shipments_tracking ON public.shipments(tracking_number);

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants and admins read shipments" ON public.shipments
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = shipments.order_id
        AND auth.uid() IN (o.buyer_id, o.farmer_id)
    )
  );

REVOKE ALL ON public.shipments FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.shipments FROM authenticated;
GRANT SELECT ON public.shipments TO authenticated;

-- Dispatches a 3PL freight carrier for an escrow order.
CREATE OR REPLACE FUNCTION public.dispatch_shipment(
  p_order_id      UUID,
  p_carrier       TEXT,
  p_driver_name   TEXT DEFAULT NULL,
  p_vehicle       TEXT DEFAULT NULL
)
RETURNS public.shipments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_tracking TEXT;
  v_shipment public.shipments%ROWTYPE;
  v_init_lat NUMERIC(9,6);
  v_init_lng NUMERIC(9,6);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000'; END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;

  IF auth.uid() <> v_order.farmer_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501';
  END IF;

  IF v_order.status NOT IN ('ESCROW_LOCKED', 'IN_TRANSIT') THEN
    RAISE EXCEPTION 'ORDER_NOT_READY_FOR_DISPATCH' USING ERRCODE = '22023';
  END IF;

  v_tracking := 'AGRO-3PL-' || upper(substring(encode(gen_random_bytes(4), 'hex') from 1 for 8));
  v_init_lat := coalesce(v_order.origin_lat, 23.1667); -- default Jessore regional depot
  v_init_lng := coalesce(v_order.origin_lng, 89.2167);

  INSERT INTO public.shipments (
    order_id, carrier_name, tracking_number, driver_name, vehicle_plate,
    status, current_lat, current_lng, waypoints
  )
  VALUES (
    p_order_id, trim(p_carrier), v_tracking, trim(p_driver_name), trim(p_vehicle),
    'IN_TRANSIT', v_init_lat, v_init_lng,
    jsonb_build_array(jsonb_build_object(
      'lat', v_init_lat, 'lng', v_init_lng,
      'status', 'IN_TRANSIT', 'note', 'Freight picked up at farm depot',
      'recorded_at', now()
    ))
  )
  RETURNING * INTO v_shipment;

  -- Sync order status and GPS
  UPDATE public.orders
  SET status = 'IN_TRANSIT', current_lat = v_init_lat, current_lng = v_init_lng
  WHERE id = p_order_id;

  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'SHIPMENT_DISPATCHED', 'shipment', v_shipment.id,
          jsonb_build_object('order_id', p_order_id, 'tracking', v_tracking, 'carrier', p_carrier));

  INSERT INTO public.notifications (user_id, title, body, icon_type)
  VALUES (v_order.buyer_id, 'Logistics Dispatched',
          '3PL carrier ' || p_carrier || ' dispatched with tracking ' || v_tracking || '.', 'order');

  RETURN v_shipment;
END;
$$;

-- Ingests live telemetry GPS coordinates and transit milestones.
CREATE OR REPLACE FUNCTION public.update_shipment_telemetry(
  p_shipment_id   UUID,
  p_lat           NUMERIC,
  p_lng           NUMERIC,
  p_status        TEXT DEFAULT 'IN_TRANSIT',
  p_note          TEXT DEFAULT 'In transit'
)
RETURNS public.shipments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_shipment public.shipments%ROWTYPE;
  v_order public.orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000'; END IF;

  SELECT * INTO v_shipment FROM public.shipments WHERE id = p_shipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'P0002'; END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = v_shipment.order_id;
  IF auth.uid() <> v_order.farmer_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501';
  END IF;

  UPDATE public.shipments
  SET current_lat = p_lat,
      current_lng = p_lng,
      status = coalesce(p_status, status),
      waypoints = waypoints || jsonb_build_object(
        'lat', p_lat, 'lng', p_lng,
        'status', coalesce(p_status, status),
        'note', p_note,
        'recorded_at', now()
      ),
      updated_at = now()
  WHERE id = p_shipment_id
  RETURNING * INTO v_shipment;

  UPDATE public.orders
  SET current_lat = p_lat, current_lng = p_lng
  WHERE id = v_shipment.order_id;

  RETURN v_shipment;
END;
$$;

REVOKE ALL ON FUNCTION public.dispatch_shipment(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_shipment_telemetry(UUID, NUMERIC, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.dispatch_shipment(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_shipment_telemetry(UUID, NUMERIC, NUMERIC, TEXT, TEXT) TO authenticated;
