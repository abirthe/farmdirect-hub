-- Forward contracts: farmers pre-sell part of a growing crop at a locked price; buyers accept.
-- No money moves here (advance payment/escrow is a separate, payment-flow slice).
-- Rollback:
--   DROP FUNCTION IF EXISTS public.create_forward_contract(UUID,NUMERIC,NUMERIC,DATE), public.accept_forward_contract(UUID),
--     public.cancel_forward_contract(UUID), public.committed_tons(UUID);
--   DROP TABLE IF EXISTS public.forward_contracts; DROP TYPE IF EXISTS public.forward_status;

CREATE TYPE public.forward_status AS ENUM ('OFFERED', 'ACCEPTED', 'CANCELLED');

CREATE TABLE public.forward_contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  crop_cycle_id   UUID NOT NULL REFERENCES public.crop_cycles(id) ON DELETE CASCADE,
  buyer_id        UUID REFERENCES public.users(id) ON DELETE SET NULL,
  qty_tons        NUMERIC(12,3) NOT NULL CHECK (qty_tons > 0),
  price_per_ton   NUMERIC(14,2) NOT NULL CHECK (price_per_ton > 0),
  delivery_date   DATE NOT NULL,
  status          public.forward_status NOT NULL DEFAULT 'OFFERED',
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((status = 'ACCEPTED') = (buyer_id IS NOT NULL AND accepted_at IS NOT NULL) OR status = 'CANCELLED')
);
CREATE INDEX idx_forward_farmer ON public.forward_contracts(farmer_id);
CREATE INDEX idx_forward_buyer ON public.forward_contracts(buyer_id);
CREATE INDEX idx_forward_cycle ON public.forward_contracts(crop_cycle_id, status);
CREATE INDEX idx_forward_open ON public.forward_contracts(status, delivery_date);

ALTER TABLE public.forward_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read open or own forward contracts" ON public.forward_contracts FOR SELECT TO authenticated
  USING (status = 'OFFERED' OR farmer_id = auth.uid() OR buyer_id = auth.uid() OR public.is_admin());
REVOKE ALL ON public.forward_contracts FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.forward_contracts FROM authenticated;
GRANT SELECT ON public.forward_contracts TO authenticated;

-- Tons of a crop cycle already promised (open offers + accepted contracts).
CREATE OR REPLACE FUNCTION public.committed_tons(p_cycle UUID)
RETURNS NUMERIC LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT coalesce(sum(qty_tons), 0) FROM public.forward_contracts
   WHERE crop_cycle_id = p_cycle AND status IN ('OFFERED', 'ACCEPTED');
$$;

CREATE OR REPLACE FUNCTION public.create_forward_contract(
  p_cycle UUID, p_qty NUMERIC, p_price NUMERIC, p_delivery DATE)
RETURNS public.forward_contracts LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user public.users%ROWTYPE; v_cycle public.crop_cycles%ROWTYPE; v_owner UUID; v_fc public.forward_contracts%ROWTYPE;
  v_capacity NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000'; END IF;
  SELECT * INTO v_user FROM public.users WHERE id = auth.uid();
  IF v_user.role <> 'FARMER' OR v_user.status = 'SUSPENDED' THEN RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501'; END IF;

  -- Lock the cycle row so concurrent offers cannot over-commit the harvest.
  SELECT c.* INTO v_cycle FROM public.crop_cycles c WHERE c.id = p_cycle FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  SELECT user_id INTO v_owner FROM public.farms WHERE id = v_cycle.farm_id;
  IF v_owner <> auth.uid() THEN RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501'; END IF;
  IF v_cycle.status <> 'GROWING' THEN RAISE EXCEPTION 'CYCLE_NOT_GROWING' USING ERRCODE = '22023'; END IF;
  IF p_delivery <= current_date THEN RAISE EXCEPTION 'INVALID_DELIVERY_DATE' USING ERRCODE = '22023'; END IF;

  v_capacity := coalesce(v_cycle.ai_predicted_yield_kg, 0) / 1000.0 - public.committed_tons(p_cycle);
  IF p_qty > v_capacity THEN RAISE EXCEPTION 'EXCEEDS_EXPECTED_YIELD' USING ERRCODE = '22023'; END IF;

  INSERT INTO public.forward_contracts (farmer_id, crop_cycle_id, qty_tons, price_per_ton, delivery_date)
  VALUES (auth.uid(), p_cycle, p_qty, p_price, p_delivery) RETURNING * INTO v_fc;
  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'FORWARD_OFFERED', 'forward_contract', v_fc.id, jsonb_build_object('qty', p_qty, 'price', p_price));
  RETURN v_fc;
END; $$;

CREATE OR REPLACE FUNCTION public.accept_forward_contract(p_id UUID)
RETURNS public.forward_contracts LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user public.users%ROWTYPE; v_fc public.forward_contracts%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000'; END IF;
  SELECT * INTO v_user FROM public.users WHERE id = auth.uid();
  IF v_user.role <> 'BUYER' OR v_user.status = 'SUSPENDED' THEN RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_fc FROM public.forward_contracts WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR v_fc.status <> 'OFFERED' OR v_fc.delivery_date <= current_date THEN
    RAISE EXCEPTION 'ILLEGAL_TRANSITION' USING ERRCODE = '22023';
  END IF;
  UPDATE public.forward_contracts SET status = 'ACCEPTED', buyer_id = auth.uid(), accepted_at = now()
   WHERE id = p_id RETURNING * INTO v_fc;
  INSERT INTO public.notifications (user_id, title, body, icon_type)
  VALUES (v_fc.farmer_id, 'Forward contract accepted', 'A buyer accepted your forward contract.', 'order');
  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'FORWARD_ACCEPTED', 'forward_contract', v_fc.id, jsonb_build_object('qty', v_fc.qty_tons, 'price', v_fc.price_per_ton));
  RETURN v_fc;
END; $$;

-- Only the farmer, and only while still unaccepted (accepted contracts are binding).
CREATE OR REPLACE FUNCTION public.cancel_forward_contract(p_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE public.forward_contracts SET status = 'CANCELLED'
   WHERE id = p_id AND farmer_id = auth.uid() AND status = 'OFFERED';
  IF NOT FOUND THEN RAISE EXCEPTION 'ILLEGAL_TRANSITION' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'FORWARD_CANCELLED', 'forward_contract', p_id, '{}'::jsonb);
END; $$;

REVOKE ALL ON FUNCTION public.committed_tons(UUID), public.create_forward_contract(UUID,NUMERIC,NUMERIC,DATE),
  public.accept_forward_contract(UUID), public.cancel_forward_contract(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_forward_contract(UUID,NUMERIC,NUMERIC,DATE),
  public.accept_forward_contract(UUID), public.cancel_forward_contract(UUID) TO authenticated;
