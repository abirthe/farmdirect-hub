-- Migration: 20261010035000_harden_admin_and_internal_rpcs.sql
-- Revokes client/authenticated execution rights from backend-only service functions:
-- 1. admin_set_user_status: platform user status changes are restricted to service_role
-- 2. transition_order: direct order state machine transitions are restricted to service_role

REVOKE EXECUTE ON FUNCTION public.admin_set_user_status(UUID, public.platform_status) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(UUID, public.platform_status) TO service_role;

REVOKE EXECUTE ON FUNCTION public.transition_order(UUID, public.order_status) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transition_order(UUID, public.order_status) TO service_role;
