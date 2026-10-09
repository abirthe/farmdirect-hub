-- Migration: Complete Manual bKash Escrow Payment Engine following /payment-flow
-- Rules:
-- 1. Designated official bKash Merchant/Personal Escrow Number: 01580382868
-- 2. Buyer submits TrxID through submit_bkash_payment RPC; enforces format validation & uniqueness constraint.
-- 3. Transition to PAYMENT_SUBMITTED.
-- 4. Admin verifies TrxID via verify_bkash_payment RPC, transitioning order to ESCROW_LOCKED.
-- 5. Customer can cancel unpaid order (restoring inventory to listings).
-- 6. All actions recorded in immutable audit_log with actor and metadata.

-- 1. Schema Extensions for Payments on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'BKASH',
  ADD COLUMN IF NOT EXISTS bkash_sender_number TEXT,
  ADD COLUMN IF NOT EXISTS bkash_trx_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_submitted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_verified_by UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '45 minutes');

-- Enforce unique TrxID across all orders (prevents replay / duplicate claims)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_bkash_trx_id 
  ON public.orders (upper(bkash_trx_id)) 
  WHERE bkash_trx_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (status, expires_at);

-- 2. RPC: Submit bKash TrxID (Buyer Action)
CREATE OR REPLACE FUNCTION public.submit_bkash_payment(
  p_order_id UUID,
  p_sender_number TEXT,
  p_trx_id TEXT
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_clean_phone TEXT;
  v_clean_trx TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000';
  END IF;

  -- Clean and validate inputs
  v_clean_phone := regexp_replace(coalesce(p_sender_number, ''), '\s+', '', 'g');
  v_clean_trx := upper(trim(coalesce(p_trx_id, '')));

  IF length(v_clean_phone) < 11 OR v_clean_phone !~ '^(?:\+?88)?01[3-9]\d{8}$' THEN
    RAISE EXCEPTION 'INVALID_PHONE_NUMBER: Please provide a valid 11-digit Bangladeshi bKash number' USING ERRCODE = '22023';
  END IF;

  IF length(v_clean_trx) < 8 OR length(v_clean_trx) > 16 OR v_clean_trx !~ '^[A-Z0-9]+$' THEN
    RAISE EXCEPTION 'INVALID_TRX_ID: Please enter a valid 8-16 alphanumeric bKash Transaction ID' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_order.buyer_id <> auth.uid() THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ORDER_ACCESS' USING ERRCODE = '42501';
  END IF;

  IF v_order.status NOT IN ('INITIATED', 'CANCELLED') THEN
    RAISE EXCEPTION 'ILLEGAL_PAYMENT_STATE: Order is already paid or in progress (%s)', v_order.status USING ERRCODE = '42501';
  END IF;

  -- Update order with payment verification submission
  UPDATE public.orders
  SET
    payment_method = 'BKASH',
    bkash_sender_number = v_clean_phone,
    bkash_trx_id = v_clean_trx,
    payment_submitted_at = NOW(),
    status = 'PAYMENT_SUBMITTED'::order_status,
    updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  -- Audit log entry
  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (
    auth.uid(),
    'PAYMENT_SUBMITTED',
    'order',
    p_order_id,
    jsonb_build_object(
      'method', 'BKASH',
      'escrow_number', '01580382868',
      'sender', v_clean_phone,
      'trx_id', v_clean_trx,
      'amount', v_order.total_price
    )
  );

  -- Notify Admins & Farmer
  INSERT INTO public.notifications (user_id, title, body, icon_type)
  VALUES (
    v_order.farmer_id,
    'Payment Submitted for Escrow',
    'Buyer submitted bKash TrxID ' || v_clean_trx || '. Awaiting admin escrow lock confirmation.',
    'order'
  );

  RETURN v_order;
END;
$$;

-- 3. RPC: Admin Verify bKash Payment & Lock Escrow
CREATE OR REPLACE FUNCTION public.verify_bkash_payment(
  p_order_id UUID,
  p_approved BOOLEAN,
  p_note TEXT DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'ADMIN_AUTHORIZATION_REQUIRED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_order.status <> 'PAYMENT_SUBMITTED' AND v_order.status <> 'INITIATED' THEN
    RAISE EXCEPTION 'INVALID_VERIFICATION_STATUS: Order is %s', v_order.status USING ERRCODE = '42501';
  END IF;

  IF p_approved THEN
    UPDATE public.orders
    SET
      status = 'ESCROW_LOCKED'::order_status,
      payment_verified_at = NOW(),
      payment_verified_by = auth.uid(),
      updated_at = NOW()
    WHERE id = p_order_id
    RETURNING * INTO v_order;

    INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
    VALUES (
      auth.uid(),
      'ESCROW_LOCKED_BKASH_VERIFIED',
      'order',
      p_order_id,
      jsonb_build_object(
        'trx_id', v_order.bkash_trx_id,
        'amount', v_order.total_price,
        'note', p_note
      )
    );

    -- Notify Buyer
    INSERT INTO public.notifications (user_id, title, body, icon_type)
    VALUES (
      v_order.buyer_id,
      'Escrow Deposit Confirmed',
      'Your bKash payment (' || v_order.total_price || ') was verified. Escrow is locked.',
      'order'
    );

    -- Notify Farmer to dispatch
    INSERT INTO public.notifications (user_id, title, body, icon_type)
    VALUES (
      v_order.farmer_id,
      'Escrow Secured: Dispatch Crops',
      'Funds are safely held in escrow. You can now prepare crop dispatch.',
      'order'
    );
  ELSE
    -- Payment Rejected
    UPDATE public.orders
    SET
      status = 'INITIATED'::order_status,
      updated_at = NOW()
    WHERE id = p_order_id
    RETURNING * INTO v_order;

    INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
    VALUES (
      auth.uid(),
      'PAYMENT_REJECTED',
      'order',
      p_order_id,
      jsonb_build_object('trx_id', v_order.bkash_trx_id, 'reason', p_note)
    );

    INSERT INTO public.notifications (user_id, title, body, icon_type)
    VALUES (
      v_order.buyer_id,
      'bKash Verification Failed',
      'Payment was not recognized. Reason: ' || coalesce(p_note, 'Invalid TrxID') || '. Please re-submit.',
      'order'
    );
  END IF;

  RETURN v_order;
END;
$$;

-- 4. RPC: Cancel Unpaid Order (Customer Cancel - restores stock)
CREATE OR REPLACE FUNCTION public.cancel_unpaid_order(p_order_id UUID)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_order.buyer_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '42501';
  END IF;

  IF v_order.status NOT IN ('INITIATED', 'PAYMENT_SUBMITTED') THEN
    RAISE EXCEPTION 'CANNOT_CANCEL: Order has already entered escrow lock (%s)', v_order.status USING ERRCODE = '42501';
  END IF;

  -- Restore stock back to listing
  UPDATE public.listings
  SET
    quantity_tons = quantity_tons + v_order.qty_purchased,
    status = 'ACTIVE'::listing_status
  WHERE id = v_order.listing_id;

  UPDATE public.orders
  SET
    status = 'CANCELLED'::order_status,
    updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, details)
  VALUES (
    auth.uid(),
    'ORDER_CANCELLED',
    'order',
    p_order_id,
    jsonb_build_object('restored_qty', v_order.qty_purchased)
  );

  RETURN v_order;
END;
$$;
