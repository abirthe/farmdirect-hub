-- Migration: 20261010034500_optimize_rls_initplan_and_policies.sql
-- Optimizes RLS performance:
-- 1. Wraps auth.uid() in (SELECT auth.uid()) across all 24 flagged policies to evaluate as InitPlan
-- 2. Consolidates multiple permissive policies for SELECT into single policies across tables
-- 3. Revokes non-client internal helper functions from authenticated role

-- ============================================================================
-- 1. Table: public.users
-- ============================================================================
DROP POLICY IF EXISTS "Users can only update their own profile" ON public.users;
CREATE POLICY "Users can only update their own profile" ON public.users
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================================================
-- 2. Table: public.farms
-- ============================================================================
DROP POLICY IF EXISTS "Farmers can insert their own farms" ON public.farms;
CREATE POLICY "Farmers can insert their own farms" ON public.farms
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Farmers can update their own farms" ON public.farms;
CREATE POLICY "Farmers can update their own farms" ON public.farms
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Farmers can delete their own farms" ON public.farms;
CREATE POLICY "Farmers can delete their own farms" ON public.farms
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 3. Table: public.crop_cycles
-- ============================================================================
DROP POLICY IF EXISTS "Farmers can manage their crop cycles" ON public.crop_cycles;

CREATE POLICY "Farmers can insert their crop cycles" ON public.crop_cycles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Farmers can update their crop cycles" ON public.crop_cycles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Farmers can delete their crop cycles" ON public.crop_cycles
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.user_id = (SELECT auth.uid()))
  );

-- ============================================================================
-- 4. Table: public.telemetry_logs
-- ============================================================================
DROP POLICY IF EXISTS "Owners and admins read telemetry" ON public.telemetry_logs;
DROP POLICY IF EXISTS "System/Farmers can manage telemetry" ON public.telemetry_logs;

CREATE POLICY "Owners and admins read telemetry" ON public.telemetry_logs
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.crop_cycles c
      JOIN public.farms f ON f.id = c.farm_id
      WHERE c.id = crop_cycle_id AND f.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Farmers can insert telemetry" ON public.telemetry_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.crop_cycles c
      JOIN public.farms f ON f.id = c.farm_id
      WHERE c.id = crop_cycle_id AND f.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Farmers can update telemetry" ON public.telemetry_logs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.crop_cycles c
      JOIN public.farms f ON f.id = c.farm_id
      WHERE c.id = crop_cycle_id AND f.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Farmers can delete telemetry" ON public.telemetry_logs
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.crop_cycles c
      JOIN public.farms f ON f.id = c.farm_id
      WHERE c.id = crop_cycle_id AND f.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- 5. Table: public.notifications
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users mark own notifications read" ON public.notifications;
CREATE POLICY "Users mark own notifications read" ON public.notifications
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 6. Table: public.orders
-- ============================================================================
DROP POLICY IF EXISTS "Participants and admins read orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view verified batch orders" ON public.orders;

CREATE POLICY "Orders select policy" ON public.orders
  FOR SELECT TO anon, authenticated
  USING (
    (qr_delivery_hash IS NOT NULL AND status IN ('IN_TRANSIT', 'DELIVERED', 'RELEASED'))
    OR (SELECT auth.uid()) = buyer_id
    OR (SELECT auth.uid()) = farmer_id
    OR public.is_admin()
  );

-- ============================================================================
-- 7. Table: public.listings
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Anyone can view listings for batch trace" ON public.listings;
DROP POLICY IF EXISTS "Owners see own non-active listings" ON public.listings;
DROP POLICY IF EXISTS "Verified farmers manage own listings" ON public.listings;
DROP POLICY IF EXISTS "Farmers can manage their listings" ON public.listings;

CREATE POLICY "Listings select policy" ON public.listings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Verified farmers insert own listings" ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid()) AND u.role = 'FARMER' AND u.status = 'VERIFIED'
    )
    AND EXISTS (
      SELECT 1 FROM public.crop_cycles c
      JOIN public.farms f ON f.id = c.farm_id
      WHERE c.id = crop_cycle_id AND f.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Verified farmers update own listings" ON public.listings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.crop_cycles c
      JOIN public.farms f ON f.id = c.farm_id
      WHERE c.id = crop_cycle_id AND f.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid()) AND u.role = 'FARMER' AND u.status = 'VERIFIED'
    )
    AND EXISTS (
      SELECT 1 FROM public.crop_cycles c
      JOIN public.farms f ON f.id = c.farm_id
      WHERE c.id = crop_cycle_id AND f.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Verified farmers delete own listings" ON public.listings
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.crop_cycles c
      JOIN public.farms f ON f.id = c.farm_id
      WHERE c.id = crop_cycle_id AND f.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- 8. Table: public.commodity_reports
-- ============================================================================
DROP POLICY IF EXISTS "Admins manage commodity reports" ON public.commodity_reports;

CREATE POLICY "Admins insert commodity reports" ON public.commodity_reports
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins update commodity reports" ON public.commodity_reports
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete commodity reports" ON public.commodity_reports
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 9. Table: public.regional_shortage_forecasts
-- ============================================================================
DROP POLICY IF EXISTS "Admins manage shortage forecasts" ON public.regional_shortage_forecasts;

CREATE POLICY "Admins insert shortage forecasts" ON public.regional_shortage_forecasts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins update shortage forecasts" ON public.regional_shortage_forecasts
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete shortage forecasts" ON public.regional_shortage_forecasts
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 10. Table: public.rfqs
-- ============================================================================
DROP POLICY IF EXISTS "Read open or own rfqs" ON public.rfqs;
CREATE POLICY "Read open or own rfqs" ON public.rfqs
  FOR SELECT TO authenticated
  USING (status = 'OPEN' OR buyer_id = (SELECT auth.uid()) OR public.is_admin());

-- ============================================================================
-- 11. Table: public.rfq_bids
-- ============================================================================
DROP POLICY IF EXISTS "Read own or owned-rfq bids" ON public.rfq_bids;
CREATE POLICY "Read own or owned-rfq bids" ON public.rfq_bids
  FOR SELECT TO authenticated
  USING (
    farmer_id = (SELECT auth.uid())
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.rfqs r
      WHERE r.id = rfq_id AND r.buyer_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- 12. Table: public.kyc_verifications
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own KYC verifications" ON public.kyc_verifications;
CREATE POLICY "Users can view own KYC verifications" ON public.kyc_verifications
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own KYC verifications" ON public.kyc_verifications;
CREATE POLICY "Users can insert own KYC verifications" ON public.kyc_verifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 13. Table: public.forward_contracts
-- ============================================================================
DROP POLICY IF EXISTS "Read open or own forward contracts" ON public.forward_contracts;
CREATE POLICY "Read open or own forward contracts" ON public.forward_contracts
  FOR SELECT TO authenticated
  USING (status = 'OFFERED' OR farmer_id = (SELECT auth.uid()) OR buyer_id = (SELECT auth.uid()) OR public.is_admin());

-- ============================================================================
-- 14. Table: public.disputes
-- ============================================================================
DROP POLICY IF EXISTS "Participants and admins read disputes" ON public.disputes;
CREATE POLICY "Participants and admins read disputes" ON public.disputes
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (SELECT auth.uid()) IN (o.buyer_id, o.farmer_id)
    )
  );

-- ============================================================================
-- 15. Table: public.dispute_evidence
-- ============================================================================
DROP POLICY IF EXISTS "Participants and admins read evidence" ON public.dispute_evidence;
CREATE POLICY "Participants and admins read evidence" ON public.dispute_evidence
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.disputes d
      JOIN public.orders o ON o.id = d.order_id
      WHERE d.id = dispute_id AND (SELECT auth.uid()) IN (o.buyer_id, o.farmer_id)
    )
  );

-- ============================================================================
-- 16. Table: public.underwriting_passports
-- ============================================================================
DROP POLICY IF EXISTS "Farmers read own underwriting passports" ON public.underwriting_passports;
CREATE POLICY "Farmers read own underwriting passports" ON public.underwriting_passports
  FOR SELECT TO authenticated
  USING (farmer_id = (SELECT auth.uid()) OR public.is_admin());

-- ============================================================================
-- 17. Table: public.shipments
-- ============================================================================
DROP POLICY IF EXISTS "Participants and admins read shipments" ON public.shipments;
CREATE POLICY "Participants and admins read shipments" ON public.shipments
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = shipments.order_id
        AND (SELECT auth.uid()) IN (o.buyer_id, o.farmer_id)
    )
  );

-- ============================================================================
-- 18. Table: public.sensor_devices
-- ============================================================================
DROP POLICY IF EXISTS "Farmers and admins read sensor devices" ON public.sensor_devices;
CREATE POLICY "Farmers and admins read sensor devices" ON public.sensor_devices
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.crop_cycles c
      JOIN public.farms f ON f.id = c.farm_id
      WHERE c.id = sensor_devices.crop_cycle_id AND f.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- 19. Table: public.prescriptions
-- ============================================================================
DROP POLICY IF EXISTS "Farmers view own prescriptions" ON public.prescriptions;
CREATE POLICY "Farmers view own prescriptions" ON public.prescriptions
  FOR SELECT TO authenticated
  USING (
    farmer_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.farms f
      JOIN public.crop_cycles c ON c.farm_id = f.id
      WHERE c.id = prescriptions.crop_cycle_id AND f.user_id = (SELECT auth.uid())
    ) OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Farmers update own prescriptions" ON public.prescriptions;
CREATE POLICY "Farmers update own prescriptions" ON public.prescriptions
  FOR UPDATE TO authenticated
  USING (farmer_id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (farmer_id = (SELECT auth.uid()) OR public.is_admin());

-- ============================================================================
-- 20. Non-client internal helper functions: Revoke authenticated EXECUTE
-- ============================================================================
REVOKE EXECUTE ON FUNCTION public.record_audit_entry(TEXT, TEXT, UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_audit_entry(TEXT, TEXT, UUID, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.cancel_unpaid_order(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_unpaid_order(UUID) TO service_role;
