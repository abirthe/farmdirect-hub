-- Migration: Auto-provision designated platform administrator
-- Designates md.abirsharif68@gmail.com as verified platform administrator with role 'ADMIN'.
-- Updates handle_new_user trigger and promotes existing user profile if already registered.

-- 1. Update handle_new_user to recognize designated admin email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_requested TEXT := upper(coalesce(new.raw_user_meta_data->>'role', 'FARMER'));
  v_email TEXT := lower(coalesce(new.email, ''));
  v_role user_role;
  v_status platform_status;
BEGIN
  IF v_email = 'md.abirsharif68@gmail.com' THEN
    v_role := 'ADMIN'::user_role;
    v_status := 'VERIFIED'::platform_status;
  ELSIF v_requested = 'BUYER' THEN
    v_role := 'BUYER'::user_role;
    v_status := 'PENDING'::platform_status;
  ELSE
    v_role := 'FARMER'::user_role;
    v_status := 'PENDING'::platform_status;
  END IF;

  INSERT INTO public.users (id, full_name, role, status)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'AgroDirect Admin'),
    v_role,
    v_status
  )
  ON CONFLICT (id) DO UPDATE
    SET role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = NOW();

  RETURN new;
END;
$$;

-- 2. Promote user profile if md.abirsharif68@gmail.com is already registered in auth.users
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE lower(email) = 'md.abirsharif68@gmail.com'
  LIMIT 1;

  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.users (id, full_name, role, status)
    VALUES (v_admin_id, 'Md. Abir Sharif', 'ADMIN', 'VERIFIED')
    ON CONFLICT (id) DO UPDATE
      SET role = 'ADMIN',
          status = 'VERIFIED',
          updated_at = NOW();
  END IF;
END;
$$;
