-- Migration: Automated Identity & Land Title Verification (KYC/KYB Rule Engine)
-- Automates farmer and buyer credentials review with automated format, parcel deduplication, and sanctions rule checks.

CREATE TABLE IF NOT EXISTS kyc_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    document_type TEXT CHECK (document_type IN ('NATIONAL_ID', 'LAND_TITLE', 'TRADE_LICENSE', 'ORGANIC_CERT')) NOT NULL,
    document_number TEXT NOT NULL,
    issuing_authority TEXT NOT NULL,
    document_url TEXT,
    status TEXT CHECK (status IN ('PENDING', 'AUTO_VERIFIED', 'MANUAL_REVIEW', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING' NOT NULL,
    automated_score NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
    automated_checks JSONB DEFAULT '{}'::jsonb NOT NULL,
    rejection_reason TEXT,
    reviewer_notes TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kyc_user ON kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_verifications(status);
CREATE INDEX IF NOT EXISTS idx_kyc_doc_num ON kyc_verifications(document_number);

ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own KYC verifications" ON kyc_verifications;
CREATE POLICY "Users can view own KYC verifications" ON kyc_verifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own KYC verifications" ON kyc_verifications;
CREATE POLICY "Users can insert own KYC verifications" ON kyc_verifications
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all KYC verifications" ON kyc_verifications;
CREATE POLICY "Admins manage all KYC verifications" ON kyc_verifications
    FOR UPDATE TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- RPC: submit_kyc_application
CREATE OR REPLACE FUNCTION submit_kyc_application(
    p_full_name TEXT,
    p_document_type TEXT,
    p_document_number TEXT,
    p_issuing_authority TEXT,
    p_document_url TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS kyc_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_clean_num TEXT;
    v_format_valid BOOLEAN := false;
    v_dedup_pass BOOLEAN := true;
    v_watchlist_clear BOOLEAN := true;
    v_score NUMERIC(5,2) := 0.0;
    v_status TEXT := 'MANUAL_REVIEW';
    v_flags TEXT[] := ARRAY[]::TEXT[];
    v_reason TEXT := NULL;
    v_rec kyc_verifications;
    v_duplicate_count INT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    v_clean_num := upper(trim(p_document_number));
    IF length(v_clean_num) < 4 THEN
        RAISE EXCEPTION 'Document number too short';
    END IF;

    -- 1. Automated Format Validation Engine
    IF p_document_type = 'NATIONAL_ID' THEN
        -- Bangladesh NID: 10 or 17 numeric digits or Smart NID alphanumeric (10 chars)
        IF v_clean_num ~ '^[0-9]{10}$' OR v_clean_num ~ '^[0-9]{17}$' OR v_clean_num ~ '^[A-Z0-9]{10}$' THEN
            v_format_valid := true;
            v_score := v_score + 40.0;
        ELSE
            v_flags := array_append(v_flags, 'Non-standard NID digit structure');
        END IF;
    ELSIF p_document_type = 'LAND_TITLE' THEN
        -- Land Khatian / Deed reference format
        IF v_clean_num ~ '^[A-Z0-9\-\/]{6,20}$' THEN
            v_format_valid := true;
            v_score := v_score + 40.0;
        ELSE
            v_flags := array_append(v_flags, 'Cadastral khatian reference invalid');
        END IF;
    ELSIF p_document_type = 'TRADE_LICENSE' THEN
        IF v_clean_num ~ '^[A-Z0-9\-\/]{6,25}$' THEN
            v_format_valid := true;
            v_score := v_score + 40.0;
        ELSE
            v_flags := array_append(v_flags, 'Trade license identifier invalid');
        END IF;
    ELSIF p_document_type = 'ORGANIC_CERT' THEN
        v_format_valid := true;
        v_score := v_score + 40.0;
    END IF;

    -- 2. Registry Deduplication Check
    SELECT count(*) INTO v_duplicate_count
    FROM kyc_verifications
    WHERE document_number = v_clean_num AND user_id != v_uid AND status IN ('AUTO_VERIFIED', 'APPROVED');

    IF v_duplicate_count > 0 THEN
        v_dedup_pass := false;
        v_flags := array_append(v_flags, 'Document number already registered to another active profile');
    ELSE
        v_score := v_score + 30.0;
    END IF;

    -- 3. Sanctions / Watchlist Screening (Simulated against high-risk test tokens)
    IF v_clean_num LIKE '%BLOCKED%' OR v_clean_num LIKE '%FRAUD%' THEN
        v_watchlist_clear := false;
        v_flags := array_append(v_flags, 'Hit on AML/Fraud security watchlist');
    ELSE
        v_score := v_score + 30.0;
    END IF;

    -- 4. Status Determination
    IF NOT v_dedup_pass OR NOT v_watchlist_clear THEN
        v_status := 'REJECTED';
        v_reason := array_to_string(v_flags, '; ');
    ELSIF v_score >= 90.0 AND v_format_valid THEN
        v_status := 'AUTO_VERIFIED';
    ELSE
        v_status := 'MANUAL_REVIEW';
    END IF;

    -- Insert Record
    INSERT INTO kyc_verifications (
        user_id, full_name, document_type, document_number, issuing_authority, document_url,
        status, automated_score, automated_checks, rejection_reason, verified_at
    )
    VALUES (
        v_uid,
        trim(p_full_name),
        p_document_type,
        v_clean_num,
        trim(p_issuing_authority),
        p_document_url,
        v_status,
        v_score,
        jsonb_build_object(
            'format_valid', v_format_valid,
            'duplicate_check_passed', v_dedup_pass,
            'watchlist_cleared', v_watchlist_clear,
            'confidence_score', v_score,
            'rule_flags', to_jsonb(v_flags),
            'analyzed_at', now()
        ),
        v_reason,
        CASE WHEN v_status = 'AUTO_VERIFIED' THEN now() ELSE NULL END
    )
    RETURNING * INTO v_rec;

    -- If auto-verified, update users table status
    IF v_status = 'AUTO_VERIFIED' THEN
        UPDATE users SET status = 'VERIFIED' WHERE id = v_uid;
    END IF;

    -- Audit Log
    PERFORM record_audit_entry(
        'SUBMIT_KYC',
        'kyc_verifications',
        v_rec.id,
        jsonb_build_object('document_type', p_document_type, 'status', v_status, 'score', v_score)
    );

    RETURN v_rec;
END;
$$;

-- RPC: review_kyc_application
CREATE OR REPLACE FUNCTION review_kyc_application(
    p_verification_id UUID,
    p_decision TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS kyc_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rec kyc_verifications;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Admin authorization required';
    END IF;

    IF p_decision NOT IN ('APPROVED', 'REJECTED') THEN
        RAISE EXCEPTION 'Decision must be APPROVED or REJECTED';
    END IF;

    SELECT * INTO v_rec FROM kyc_verifications WHERE id = p_verification_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'KYC verification % not found', p_verification_id;
    END IF;

    UPDATE kyc_verifications
    SET status = p_decision,
        reviewer_notes = p_notes,
        verified_at = CASE WHEN p_decision = 'APPROVED' THEN now() ELSE NULL END,
        rejection_reason = CASE WHEN p_decision = 'REJECTED' THEN coalesce(p_notes, 'Rejected by platform compliance officer') ELSE NULL END,
        updated_at = now()
    WHERE id = p_verification_id
    RETURNING * INTO v_rec;

    -- Update platform status of user
    IF p_decision = 'APPROVED' THEN
        UPDATE users SET status = 'VERIFIED' WHERE id = v_rec.user_id;
    END IF;

    PERFORM record_audit_entry(
        'REVIEW_KYC',
        'kyc_verifications',
        v_rec.id,
        jsonb_build_object('decision', p_decision, 'notes', p_notes, 'user_id', v_rec.user_id)
    );

    RETURN v_rec;
END;
$$;

-- RPC: get_kyc_queue
CREATE OR REPLACE FUNCTION get_kyc_queue(p_status TEXT DEFAULT NULL)
RETURNS SETOF kyc_verifications
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT *
    FROM kyc_verifications
    WHERE (p_status IS NULL OR p_status = '' OR status = p_status)
    ORDER BY 
        CASE status
            WHEN 'MANUAL_REVIEW' THEN 1
            WHEN 'PENDING' THEN 2
            WHEN 'AUTO_VERIFIED' THEN 3
            ELSE 4
        END,
        created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION submit_kyc_application(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION review_kyc_application(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_kyc_queue(TEXT) TO authenticated;
