-- Backend hardening: server-enforced orders/state machine, least-privilege RLS, audit log.
-- Forward-only; builds on 20260319170000_master_schema_privacy.sql (public.users/farms/... schema).
-- ROLLBACK NOTE: To reverse this migration manually, execute:
--   DROP FUNCTION IF EXISTS public.admin_set_user_status(UUID, platform_status);
--   DROP FUNCTION IF EXISTS public.transition_order(UUID, order_status);
--   DROP FUNCTION IF EXISTS public.place_order(UUID, NUMERIC);
--   DROP TABLE IF EXISTS public.audit_log CASCADE;
--   DROP FUNCTION IF EXISTS public.is_admin();
--   ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_qty_positive, DROP CONSTRAINT IF EXISTS listings_price_positive;
--   ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_qty_positive, DROP CONSTRAINT IF EXISTS orders_price_positive;
--   ALTER TABLE public.farms DROP CONSTRAINT IF EXISTS farms_hectares_positive;


-- ============ 1. Constraints & indexes ============
ALTER TABLE public.listings
  ADD CONSTRAINT listings_qty_positive CHECK (quantity_tons >= 0),
  ADD CONSTRAINT listings_price_positive CHECK (floor_price_per_ton > 0);
ALTER TABLE public.orders
  ADD CONSTRAINT orders_qty_positive CHECK (qty_purchased > 0),
  ADD CONSTRAINT orders_price_positive CHECK (total_price >= 0);
ALTER TABLE public.farms
  ADD CONSTRAINT farms_hectares_positive CHECK (total_hectares IS NULL OR total_hectares > 0);

CREATE INDEX IF NOT EXISTS idx_farms_user_id ON public.farms(user_id);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_farm_id ON public.crop_cycles(farm_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_cycle_date ON public.telemetry_logs(crop_cycle_id, date_logged DESC);
CREATE INDEX IF NOT EXISTS idx_listings_cycle_id ON public.listings(crop_cycle_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_farmer_id ON public.orders(farmer_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing_id ON public.orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

-- ============ 2. Helpers ============
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN' AND status <> 'SUSPENDED');
$$;

-- Signup may only self-select FARMER or BUYER; ADMIN is never assignable from client metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE requested TEXT := upper(coalesce(new.raw_user_meta_data->>'role', 'FARMER'));
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

-- ============ 3. Audit log ============
CREATE TABLE public.audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity      TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  details     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON public.audit_log(entity, entity_id, created_at DESC);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit log" ON public.audit_log FOR SELECT USING (public.is_admin());

-- ============ 4. Least-privilege grants (default deny, then allow) ============
-- Clients may never write role/status, orders, or create notifications directly.
REVOKE INSERT, UPDATE, DELETE ON public.users, public.orders, public.notifications, public.audit_log FROM anon, authenticated;
REVOKE ALL ON public.audit_log FROM anon;
GRANT UPDATE (full_name) ON public.users TO authenticated;
GRANT UPDATE (is_read) ON public.notifications TO authenticated;
GRANT SELECT ON public.audit_log TO authenticated;

DROP POLICY IF EXISTS "Buyers can initiate orders" ON public.orders;
DROP POLICY IF EXISTS "Participants can update orders" ON public.orders;
DROP POLICY IF EXISTS "Buyers and Farmers can view their own orders" ON public.orders;
CREATE POLICY "Participants and admins read orders" ON public.orders FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = farmer_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can manage their notifications" ON public.notifications;
CREATE POLICY "Users mark own notifications read" ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Telemetry is private to the farm owner (and admins); it is not marketplace data.
DROP POLICY IF EXISTS "Anyone can view telemetry logs" ON public.telemetry_logs;
CREATE POLICY "Owners and admins read telemetry" ON public.telemetry_logs FOR SELECT USING (
  public.is_admin() OR auth.uid() IN (
    SELECT f.user_id FROM public.farms f JOIN public.crop_cycles c ON c.farm_id = f.id WHERE c.id = crop_cycle_id)
);

-- Only verified farmers may publish listings (INSERT/UPDATE/DELETE policy keeps ownership check).
DROP POLICY IF EXISTS "Farmers can manage their listings" ON public.listings;
CREATE POLICY "Verified farmers manage own listings" ON public.listings FOR ALL
  USING (auth.uid() IN (SELECT f.user_id FROM public.farms f JOIN public.crop_cycles c ON c.farm_id = f.id WHERE c.id = crop_cycle_id))
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'FARMER' AND u.status = 'VERIFIED')
    AND auth.uid() IN (SELECT f.user_id FROM public.farms f JOIN public.crop_cycles c ON c.farm_id = f.id WHERE c.id = crop_cycle_id)
  );
CREATE POLICY "Owners see own non-active listings" ON public.listings FOR SELECT
  USING (auth.uid() IN (SELECT f.user_id FROM public.farms f JOIN public.crop_cycles c ON c.farm_id = f.id WHERE c.id = crop_cycle_id));

-- ============ 5. Order RPCs (server-side price, stock and state machine) ============
CREATE OR REPLACE FUNCTION public.place_order(p_listing_id UUID, p_qty NUMERIC)
RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

  -- Row lock prevents overselling under concurrent requests.
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

-- Single source of truth for legal order transitions. Escrow lock is service/admin only
-- (to be driven by the payment webhook), so a buyer cannot self-declare payment.
CREATE OR REPLACE FUNCTION public.transition_order(p_order_id UUID, p_new_status order_status)
RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

CREATE OR REPLACE FUNCTION public.admin_set_user_status(p_user_id UUID, p_status platform_status)
RETURNS public.users LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

-- RPCs: callable only by signed-in users; never anonymous.
REVOKE ALL ON FUNCTION public.place_order(UUID, NUMERIC), public.transition_order(UUID, order_status),
  public.admin_set_user_status(UUID, platform_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(UUID, NUMERIC), public.transition_order(UUID, order_status),
  public.admin_set_user_status(UUID, platform_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_order(UUID, order_status) TO service_role;
