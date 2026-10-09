-- Buyer RFQs and farmer bidding. All writes go through RPCs; tables are read-only to clients.
-- Rollback:
--   DROP FUNCTION IF EXISTS public.create_rfq(TEXT,NUMERIC,NUMERIC,TIMESTAMPTZ,TEXT), public.submit_bid(UUID,NUMERIC,NUMERIC,TEXT),
--     public.award_bid(UUID), public.cancel_rfq(UUID), public.withdraw_bid(UUID);
--   DROP TABLE IF EXISTS public.rfq_bids, public.rfqs; DROP TYPE IF EXISTS public.rfq_status, public.bid_status;

CREATE TYPE public.rfq_status AS ENUM ('OPEN', 'AWARDED', 'CANCELLED');
CREATE TYPE public.bid_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

CREATE TABLE public.rfqs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  crop_type          TEXT NOT NULL CHECK (char_length(crop_type) BETWEEN 2 AND 80),
  qty_tons           NUMERIC(12,3) NOT NULL CHECK (qty_tons > 0),
  max_price_per_ton  NUMERIC(14,2) NOT NULL CHECK (max_price_per_ton > 0),
  deadline           TIMESTAMPTZ NOT NULL,
  notes              TEXT CHECK (char_length(notes) <= 1000),
  status             public.rfq_status NOT NULL DEFAULT 'OPEN',
  awarded_bid_id     UUID,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rfqs_buyer ON public.rfqs(buyer_id);
CREATE INDEX idx_rfqs_open ON public.rfqs(status, deadline);

CREATE TABLE public.rfq_bids (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id          UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  farmer_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  price_per_ton   NUMERIC(14,2) NOT NULL CHECK (price_per_ton > 0),
  qty_tons        NUMERIC(12,3) NOT NULL CHECK (qty_tons > 0),
  note            TEXT CHECK (char_length(note) <= 500),
  status          public.bid_status NOT NULL DEFAULT 'PENDING',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rfq_id, farmer_id)  -- one bid per farmer per RFQ (a withdrawn bid is final)
);
CREATE INDEX idx_bids_rfq ON public.rfq_bids(rfq_id);
CREATE INDEX idx_bids_farmer ON public.rfq_bids(farmer_id);
ALTER TABLE public.rfqs ADD CONSTRAINT rfqs_awarded_bid_fk FOREIGN KEY (awarded_bid_id) REFERENCES public.rfq_bids(id) ON DELETE SET NULL;

ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_bids ENABLE ROW LEVEL SECURITY;

-- Farmers discover open RFQs; owners and admins see all of theirs.
CREATE POLICY "Read open or own rfqs" ON public.rfqs FOR SELECT TO authenticated
  USING (status = 'OPEN' OR buyer_id = auth.uid() OR public.is_admin());
-- Bids are private to the bidder, the RFQ owner and admins (competitors must not see prices).
CREATE POLICY "Read own or owned-rfq bids" ON public.rfq_bids FOR SELECT TO authenticated
  USING (farmer_id = auth.uid() OR public.is_admin()
         OR EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id = rfq_id AND r.buyer_id = auth.uid()));

REVOKE ALL ON public.rfqs, public.rfq_bids FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.rfqs, public.rfq_bids FROM authenticated;
GRANT SELECT ON public.rfqs, public.rfq_bids TO authenticated;

CREATE OR REPLACE FUNCTION public.create_rfq(
  p_crop TEXT, p_qty NUMERIC, p_max_price NUMERIC, p_deadline TIMESTAMPTZ, p_notes TEXT DEFAULT NULL)
RETURNS public.rfqs LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user public.users%ROWTYPE; v_rfq public.rfqs%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000'; END IF;
  SELECT * INTO v_user FROM public.users WHERE id = auth.uid();
  IF v_user.role <> 'BUYER' OR v_user.status = 'SUSPENDED' THEN RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501'; END IF;
  IF p_deadline <= now() + interval '1 hour' OR p_deadline > now() + interval '90 days' THEN
    RAISE EXCEPTION 'INVALID_DEADLINE' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.rfqs (buyer_id, crop_type, qty_tons, max_price_per_ton, deadline, notes)
  VALUES (auth.uid(), trim(p_crop), p_qty, p_max_price, p_deadline, p_notes) RETURNING * INTO v_rfq;
  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'RFQ_CREATED', 'rfq', v_rfq.id, jsonb_build_object('crop', v_rfq.crop_type, 'qty', p_qty));
  RETURN v_rfq;
END; $$;

CREATE OR REPLACE FUNCTION public.submit_bid(p_rfq_id UUID, p_price NUMERIC, p_qty NUMERIC, p_note TEXT DEFAULT NULL)
RETURNS public.rfq_bids LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user public.users%ROWTYPE; v_rfq public.rfqs%ROWTYPE; v_bid public.rfq_bids%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000'; END IF;
  SELECT * INTO v_user FROM public.users WHERE id = auth.uid();
  IF v_user.role <> 'FARMER' OR v_user.status = 'SUSPENDED' THEN RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_rfq FROM public.rfqs WHERE id = p_rfq_id FOR UPDATE;
  IF NOT FOUND OR v_rfq.status <> 'OPEN' OR v_rfq.deadline <= now() THEN RAISE EXCEPTION 'RFQ_CLOSED' USING ERRCODE = 'P0002'; END IF;
  IF p_price > v_rfq.max_price_per_ton THEN RAISE EXCEPTION 'PRICE_ABOVE_MAX' USING ERRCODE = '22023'; END IF;
  IF p_qty > v_rfq.qty_tons THEN RAISE EXCEPTION 'QTY_ABOVE_REQUESTED' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.rfq_bids (rfq_id, farmer_id, price_per_ton, qty_tons, note)
  VALUES (p_rfq_id, auth.uid(), p_price, p_qty, p_note) RETURNING * INTO v_bid;
  INSERT INTO public.notifications (user_id, title, body, icon_type)
  VALUES (v_rfq.buyer_id, 'New bid', 'A farmer bid on your ' || v_rfq.crop_type || ' request.', 'order');
  RETURN v_bid;
END; $$;

CREATE OR REPLACE FUNCTION public.withdraw_bid(p_bid_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE public.rfq_bids SET status = 'WITHDRAWN'
   WHERE id = p_bid_id AND farmer_id = auth.uid() AND status = 'PENDING';
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501'; END IF;
END; $$;

-- Buyer accepts one pending bid: RFQ becomes AWARDED, all other pending bids REJECTED, farmers notified.
CREATE OR REPLACE FUNCTION public.award_bid(p_bid_id UUID)
RETURNS public.rfqs LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_bid public.rfq_bids%ROWTYPE; v_rfq public.rfqs%ROWTYPE;
BEGIN
  SELECT * INTO v_bid FROM public.rfq_bids WHERE id = p_bid_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO v_rfq FROM public.rfqs WHERE id = v_bid.rfq_id FOR UPDATE;
  IF v_rfq.buyer_id <> auth.uid() THEN RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501'; END IF;
  IF v_rfq.status <> 'OPEN' OR v_bid.status <> 'PENDING' THEN RAISE EXCEPTION 'ILLEGAL_TRANSITION' USING ERRCODE = '22023'; END IF;

  UPDATE public.rfq_bids SET status = CASE WHEN id = p_bid_id THEN 'ACCEPTED'::bid_status ELSE 'REJECTED'::bid_status END
   WHERE rfq_id = v_rfq.id AND status = 'PENDING';
  UPDATE public.rfqs SET status = 'AWARDED', awarded_bid_id = p_bid_id WHERE id = v_rfq.id RETURNING * INTO v_rfq;

  INSERT INTO public.notifications (user_id, title, body, icon_type)
  SELECT b.farmer_id,
         CASE WHEN b.id = p_bid_id THEN 'Bid accepted' ELSE 'Bid not selected' END,
         'Your bid on ' || v_rfq.crop_type || ' was ' || CASE WHEN b.id = p_bid_id THEN 'accepted.' ELSE 'not selected.' END,
         'order'
    FROM public.rfq_bids b WHERE b.rfq_id = v_rfq.id AND b.status IN ('ACCEPTED', 'REJECTED');
  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'RFQ_AWARDED', 'rfq', v_rfq.id, jsonb_build_object('bid_id', p_bid_id, 'price', v_bid.price_per_ton));
  RETURN v_rfq;
END; $$;

CREATE OR REPLACE FUNCTION public.cancel_rfq(p_rfq_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE public.rfqs SET status = 'CANCELLED' WHERE id = p_rfq_id AND buyer_id = auth.uid() AND status = 'OPEN';
  IF NOT FOUND THEN RAISE EXCEPTION 'ILLEGAL_TRANSITION' USING ERRCODE = '22023'; END IF;
  UPDATE public.rfq_bids SET status = 'REJECTED' WHERE rfq_id = p_rfq_id AND status = 'PENDING';
  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'RFQ_CANCELLED', 'rfq', p_rfq_id, '{}'::jsonb);
END; $$;

REVOKE ALL ON FUNCTION public.create_rfq(TEXT,NUMERIC,NUMERIC,TIMESTAMPTZ,TEXT), public.submit_bid(UUID,NUMERIC,NUMERIC,TEXT),
  public.withdraw_bid(UUID), public.award_bid(UUID), public.cancel_rfq(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_rfq(TEXT,NUMERIC,NUMERIC,TIMESTAMPTZ,TEXT), public.submit_bid(UUID,NUMERIC,NUMERIC,TEXT),
  public.withdraw_bid(UUID), public.award_bid(UUID), public.cancel_rfq(UUID) TO authenticated;
