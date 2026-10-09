-- Migration: 20261009180000_fix_security_definer_view.sql
-- Fixes Supabase database linter error 0010_security_definer_view:
-- Sets security_invoker = true on public.order_public_traces so it enforces
-- PostgreSQL permissions and RLS policies of the querying caller.

-- 1. Enable security_invoker on order_public_traces view
ALTER VIEW public.order_public_traces SET (security_invoker = true);

-- 2. Add RLS policy for public batch traceability on orders
-- Permits querying orders that have a generated QR delivery hash
DROP POLICY IF EXISTS "Public can view verified batch orders" ON public.orders;
CREATE POLICY "Public can view verified batch orders" ON public.orders
    FOR SELECT TO anon, authenticated
    USING (qr_delivery_hash IS NOT NULL AND status IN ('IN_TRANSIT', 'DELIVERED', 'RELEASED'));

-- 3. Ensure listings for batch trace are readable by anon
DROP POLICY IF EXISTS "Anyone can view listings for batch trace" ON public.listings;
CREATE POLICY "Anyone can view listings for batch trace" ON public.listings
    FOR SELECT TO anon, authenticated
    USING (true);

-- 4. Defense-in-depth: Restrict anon column-level access on orders to non-sensitive fields
REVOKE SELECT ON public.orders FROM anon;
GRANT SELECT (id, listing_id, status, qr_delivery_hash, qty_purchased, delivered_at, created_at) ON public.orders TO anon;
