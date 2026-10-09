-- Immutable, tamper-evident admin audit log: hash chain + block UPDATE/DELETE/TRUNCATE + verify RPC.
-- Rollback:
--   DROP FUNCTION IF EXISTS public.verify_audit_chain();
--   DROP TRIGGER IF EXISTS audit_log_chain ON public.audit_log;
--   DROP TRIGGER IF EXISTS audit_log_no_mutation ON public.audit_log;
--   DROP TRIGGER IF EXISTS audit_log_no_truncate ON public.audit_log;
--   DROP FUNCTION IF EXISTS public.audit_log_chain_fn(); DROP FUNCTION IF EXISTS public.audit_log_block_fn();
--   ALTER TABLE public.audit_log DROP COLUMN prev_hash, DROP COLUMN row_hash;

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS prev_hash TEXT,
  ADD COLUMN IF NOT EXISTS row_hash  TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_log(actor_id);

-- Canonical hash input. Epoch (not timestamptz text) so it is independent of session TimeZone.
CREATE OR REPLACE FUNCTION public.audit_row_hash(r public.audit_log, p_prev TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT encode(sha256(convert_to(
    concat_ws('|', r.id, coalesce(r.actor_id::text, ''), r.action, r.entity, r.entity_id,
              r.details::text, extract(epoch FROM r.created_at)::text, coalesce(p_prev, '')),
    'UTF8')), 'hex');
$$;

CREATE OR REPLACE FUNCTION public.audit_log_chain_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_prev TEXT;
BEGIN
  -- Serialize inserts so the chain cannot fork.
  PERFORM pg_advisory_xact_lock(hashtext('audit_log_chain'));
  SELECT row_hash INTO v_prev FROM public.audit_log
   WHERE row_hash IS NOT NULL ORDER BY created_at DESC, id DESC LIMIT 1;
  NEW.prev_hash := v_prev;
  NEW.row_hash := public.audit_row_hash(NEW, v_prev);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_log_block_fn()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'AUDIT_LOG_IMMUTABLE' USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS audit_log_chain ON public.audit_log;
CREATE TRIGGER audit_log_chain BEFORE INSERT ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_chain_fn();

DROP TRIGGER IF EXISTS audit_log_no_mutation ON public.audit_log;
CREATE TRIGGER audit_log_no_mutation BEFORE UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_block_fn();

DROP TRIGGER IF EXISTS audit_log_no_truncate ON public.audit_log;
CREATE TRIGGER audit_log_no_truncate BEFORE TRUNCATE ON public.audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION public.audit_log_block_fn();

-- Admin-only integrity check. Returns the first broken row id (NULL when the chain is intact).
CREATE OR REPLACE FUNCTION public.verify_audit_chain()
RETURNS TABLE (ok BOOLEAN, checked BIGINT, broken_id UUID)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.audit_log; v_prev TEXT := NULL; n BIGINT := 0;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501'; END IF;
  FOR r IN SELECT * FROM public.audit_log WHERE row_hash IS NOT NULL ORDER BY created_at, id LOOP
    n := n + 1;
    IF r.prev_hash IS DISTINCT FROM v_prev OR r.row_hash <> public.audit_row_hash(r, v_prev) THEN
      RETURN QUERY SELECT false, n, r.id; RETURN;
    END IF;
    v_prev := r.row_hash;
  END LOOP;
  RETURN QUERY SELECT true, n, NULL::uuid;
END;
$$;
REVOKE ALL ON FUNCTION public.verify_audit_chain() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_audit_chain() TO authenticated;
