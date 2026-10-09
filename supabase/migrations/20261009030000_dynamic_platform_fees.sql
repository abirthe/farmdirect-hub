-- Dynamic platform fees: admin-managed volume tiers, fee snapshotted on each order at placement.
-- Rollback:
--   DROP FUNCTION IF EXISTS public.set_fee_tiers(JSONB); DROP FUNCTION IF EXISTS public.compute_platform_fee_bps(NUMERIC);
--   ALTER TABLE public.orders DROP COLUMN platform_fee_bps, DROP COLUMN platform_fee;
--   DROP TABLE IF EXISTS public.fee_tiers;  (then restore place_order from 20261009010000)

CREATE TABLE IF NOT EXISTS public.fee_tiers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_order_total  NUMERIC(14,2) NOT NULL UNIQUE CHECK (min_order_total >= 0),
  rate_bps         INTEGER NOT NULL CHECK (rate_bps BETWEEN 0 AND 2000), -- hard cap 20%
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_tiers ENABLE ROW LEVEL SECURITY;
-- Fees are public information so buyers/farmers can see them before ordering.
CREATE POLICY "Anyone authenticated reads fee tiers" ON public.fee_tiers FOR SELECT TO authenticated USING (true);
REVOKE ALL ON public.fee_tiers FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.fee_tiers FROM authenticated;
GRANT SELECT ON public.fee_tiers TO authenticated;

-- Seed: preserves the current flat 3% for small orders, discounts for volume.
INSERT INTO public.fee_tiers (min_order_total, rate_bps) VALUES (0, 300), (100000, 250), (500000, 200)
ON CONFLICT (min_order_total) DO NOTHING;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS platform_fee_bps INTEGER NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(14,2) NOT NULL DEFAULT 0;

-- Highest tier whose threshold is <= order total; 300 bps if table is somehow empty.
CREATE OR REPLACE FUNCTION public.compute_platform_fee_bps(p_total NUMERIC)
RETURNS INTEGER LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT coalesce((SELECT rate_bps FROM public.fee_tiers
                    WHERE min_order_total <= p_total ORDER BY min_order_total DESC LIMIT 1), 300);
$$;
REVOKE ALL ON FUNCTION public.compute_platform_fee_bps(NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.compute_platform_fee_bps(NUMERIC) TO authenticated;

-- Admin replaces the whole tier set atomically; audited. Input: [{"min_order_total":0,"rate_bps":300},...]
CREATE OR REPLACE FUNCTION public.set_fee_tiers(p_tiers JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501'; END IF;
  IF jsonb_typeof(p_tiers) <> 'array' OR jsonb_array_length(p_tiers) = 0 THEN
    RAISE EXCEPTION 'INVALID_TIERS' USING ERRCODE = '22023';
  END IF;
  -- A tier starting at 0 must exist so every order matches a tier.
  IF NOT EXISTS (SELECT 1 FROM jsonb_to_recordset(p_tiers) AS t(min_order_total NUMERIC, rate_bps INT)
                  WHERE t.min_order_total = 0) THEN
    RAISE EXCEPTION 'TIER_ZERO_REQUIRED' USING ERRCODE = '22023';
  END IF;
  DELETE FROM public.fee_tiers WHERE true;
  INSERT INTO public.fee_tiers (min_order_total, rate_bps)
    SELECT t.min_order_total, t.rate_bps FROM jsonb_to_recordset(p_tiers) AS t(min_order_total NUMERIC, rate_bps INT);
  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'FEE_TIERS_UPDATED', 'fee_tiers', gen_random_uuid(), jsonb_build_object('tiers', p_tiers));
END;
$$;
REVOKE ALL ON FUNCTION public.set_fee_tiers(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_fee_tiers(JSONB) TO authenticated;

-- place_order: unchanged except fee snapshot (rate is frozen on the order; later tier edits never alter it).
CREATE OR REPLACE FUNCTION public.place_order(p_listing_id UUID, p_qty NUMERIC)
RETURNS public.orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
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
