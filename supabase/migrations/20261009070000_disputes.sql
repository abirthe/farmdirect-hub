-- Real disputes: raise on an order, add text evidence, admin resolves with RELEASE or REFUND.
-- Disputed orders can now only leave DISPUTED via resolve_dispute (so every resolution has a record).
-- Rollback:
--   DROP FUNCTION IF EXISTS public.open_dispute(UUID,public.dispute_reason,TEXT), public.add_dispute_evidence(UUID,TEXT),
--     public.resolve_dispute(UUID,public.dispute_status,TEXT);
--   DROP TABLE IF EXISTS public.dispute_evidence, public.disputes; DROP TYPE IF EXISTS public.dispute_reason, public.dispute_status;
--   (then restore transition_order from 20261009010000)

CREATE TYPE public.dispute_reason AS ENUM ('WEIGHT_MISMATCH', 'QUALITY_MISMATCH', 'NON_DELIVERY', 'OTHER');
CREATE TYPE public.dispute_status AS ENUM ('OPEN', 'RESOLVED_RELEASE', 'RESOLVED_REFUND');

CREATE TABLE public.disputes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  opened_by        UUID NOT NULL REFERENCES public.users(id),
  reason           public.dispute_reason NOT NULL,
  description      TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
  status           public.dispute_status NOT NULL DEFAULT 'OPEN',
  resolution_note  TEXT CHECK (char_length(resolution_note) <= 2000),
  resolved_by      UUID REFERENCES public.users(id),
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((status = 'OPEN') = (resolved_at IS NULL))
);
CREATE UNIQUE INDEX uniq_open_dispute_per_order ON public.disputes(order_id) WHERE status = 'OPEN';
CREATE INDEX idx_disputes_order ON public.disputes(order_id);
CREATE INDEX idx_disputes_opened_by ON public.disputes(opened_by);
CREATE INDEX idx_disputes_status ON public.disputes(status, created_at DESC);

CREATE TABLE public.dispute_evidence (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id  UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.users(id),
  body        TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_evidence_dispute ON public.dispute_evidence(dispute_id, created_at);
CREATE INDEX idx_evidence_author ON public.dispute_evidence(author_id);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants and admins read disputes" ON public.disputes FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_id AND auth.uid() IN (o.buyer_id, o.farmer_id)));
CREATE POLICY "Participants and admins read evidence" ON public.dispute_evidence FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.disputes d JOIN public.orders o ON o.id = d.order_id
     WHERE d.id = dispute_id AND auth.uid() IN (o.buyer_id, o.farmer_id)));

REVOKE ALL ON public.disputes, public.dispute_evidence FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.disputes, public.dispute_evidence FROM authenticated;
GRANT SELECT ON public.disputes, public.dispute_evidence TO authenticated;

CREATE OR REPLACE FUNCTION public.open_dispute(p_order_id UUID, p_reason public.dispute_reason, p_description TEXT)
RETURNS public.disputes LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_order public.orders%ROWTYPE; v_d public.disputes%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000'; END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR auth.uid() NOT IN (v_order.buyer_id, v_order.farmer_id) THEN
    RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501';
  END IF;
  IF v_order.status NOT IN ('ESCROW_LOCKED', 'IN_TRANSIT', 'DELIVERED') THEN
    RAISE EXCEPTION 'ILLEGAL_TRANSITION' USING ERRCODE = '22023';
  END IF;
  UPDATE public.orders SET status = 'DISPUTED' WHERE id = p_order_id;
  INSERT INTO public.disputes (order_id, opened_by, reason, description)
  VALUES (p_order_id, auth.uid(), p_reason, trim(p_description)) RETURNING * INTO v_d;
  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'DISPUTE_OPENED', 'dispute', v_d.id, jsonb_build_object('order_id', p_order_id, 'reason', p_reason));
  INSERT INTO public.notifications (user_id, title, body, icon_type)
  SELECT u, 'Dispute opened', 'A dispute was opened on one of your orders. Funds are on hold.', 'order'
    FROM unnest(ARRAY[v_order.buyer_id, v_order.farmer_id]) AS u WHERE u <> auth.uid();
  RETURN v_d;
END; $$;

CREATE OR REPLACE FUNCTION public.add_dispute_evidence(p_dispute_id UUID, p_body TEXT)
RETURNS public.dispute_evidence LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_d public.disputes%ROWTYPE; v_order public.orders%ROWTYPE; v_e public.dispute_evidence%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000'; END IF;
  SELECT * INTO v_d FROM public.disputes WHERE id = p_dispute_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = v_d.order_id;
  IF NOT (public.is_admin() OR auth.uid() IN (v_order.buyer_id, v_order.farmer_id)) THEN
    RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501';
  END IF;
  IF v_d.status <> 'OPEN' THEN RAISE EXCEPTION 'ILLEGAL_TRANSITION' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.dispute_evidence (dispute_id, author_id, body) VALUES (p_dispute_id, auth.uid(), trim(p_body))
  RETURNING * INTO v_e;
  RETURN v_e;
END; $$;

-- Admin-only. RELEASE pays the farmer (order RELEASED); REFUND returns funds to the buyer (order REFUNDED).
CREATE OR REPLACE FUNCTION public.resolve_dispute(p_dispute_id UUID, p_outcome public.dispute_status, p_note TEXT)
RETURNS public.disputes LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_d public.disputes%ROWTYPE; v_order public.orders%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501'; END IF;
  IF p_outcome NOT IN ('RESOLVED_RELEASE', 'RESOLVED_REFUND') THEN RAISE EXCEPTION 'INVALID_OUTCOME' USING ERRCODE = '22023'; END IF;
  IF p_note IS NULL OR char_length(trim(p_note)) < 5 THEN RAISE EXCEPTION 'NOTE_REQUIRED' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_d FROM public.disputes WHERE id = p_dispute_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  IF v_d.status <> 'OPEN' THEN RAISE EXCEPTION 'ILLEGAL_TRANSITION' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = v_d.order_id FOR UPDATE;

  UPDATE public.disputes SET status = p_outcome, resolution_note = trim(p_note), resolved_by = auth.uid(), resolved_at = now()
   WHERE id = p_dispute_id RETURNING * INTO v_d;
  UPDATE public.orders SET status = CASE WHEN p_outcome = 'RESOLVED_RELEASE' THEN 'RELEASED'::order_status ELSE 'REFUNDED'::order_status END
   WHERE id = v_order.id;

  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), CASE WHEN p_outcome = 'RESOLVED_RELEASE' THEN 'ESCROW_FORCE_RELEASE' ELSE 'ESCROW_REFUND' END,
          'dispute', v_d.id, jsonb_build_object('order_id', v_order.id, 'amount', v_order.total_price, 'note', trim(p_note)));
  INSERT INTO public.notifications (user_id, title, body, icon_type)
  SELECT u, 'Dispute resolved', 'Outcome: ' || CASE WHEN p_outcome = 'RESOLVED_RELEASE' THEN 'funds released to the farmer.' ELSE 'funds refunded to the buyer.' END, 'order'
    FROM unnest(ARRAY[v_order.buyer_id, v_order.farmer_id]) AS u;
  RETURN v_d;
END; $$;

-- transition_order minus the two DISPUTED edges: entering/leaving DISPUTED is owned by open_dispute / resolve_dispute.
CREATE OR REPLACE FUNCTION public.transition_order(p_order_id UUID, p_new_status public.order_status)
RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
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
END; $$;

REVOKE ALL ON FUNCTION public.open_dispute(UUID,public.dispute_reason,TEXT), public.add_dispute_evidence(UUID,TEXT),
  public.resolve_dispute(UUID,public.dispute_status,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_dispute(UUID,public.dispute_reason,TEXT), public.add_dispute_evidence(UUID,TEXT),
  public.resolve_dispute(UUID,public.dispute_status,TEXT) TO authenticated;
