-- ==========================================
-- AGRODIRECT COMPLETE SUPABASE PRODUCTION SCHEMA
-- Run this entire script in the Supabase SQL Editor
-- Includes real Auth integration, Triggers, RLS, and Realtime
-- ==========================================

-- ==========================================
-- 0. CLEANUP (Wiping Slate Clean)
-- ==========================================
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS telemetry_logs CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS crop_cycles CASCADE;
DROP TABLE IF EXISTS farms CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS platform_status CASCADE;
DROP TYPE IF EXISTS crop_status CASCADE;
DROP TYPE IF EXISTS listing_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ==========================================
-- 1. UTILITY FUNCTIONS & ENUMS
-- ==========================================
-- Function to auto-update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- ENUMS
CREATE TYPE user_role AS ENUM ('FARMER', 'BUYER', 'ADMIN');
CREATE TYPE platform_status AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED');
CREATE TYPE crop_status AS ENUM ('GROWING', 'MATURE', 'HARVESTED');
CREATE TYPE listing_status AS ENUM ('DRAFT', 'ACTIVE', 'SOLD_OUT', 'CANCELLED');
CREATE TYPE order_status AS ENUM ('INITIATED', 'ESCROW_LOCKED', 'IN_TRANSIT', 'DELIVERED', 'RELEASED', 'DISPUTED');

-- ==========================================
-- 2. CORE DATABASE TABLES
-- ==========================================

-- USERS (Public Profile tied directly to Supabase Auth)
CREATE TABLE users (
    -- Links natively to Supabase's internal Auth system
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Removed email and phone_number to enforce strict PII Confidentiality.
    -- (Supabase internal auth.users table holds emails securely out of API reach)
    full_name TEXT,
    role user_role DEFAULT 'FARMER',
    status platform_status DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FARMS
CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_name TEXT NOT NULL,
    location_name TEXT,
    total_hectares NUMERIC(10, 2),
    boundary_coordinates JSONB, -- GeoJSON [lat, lng]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CROP CYCLES
CREATE TABLE crop_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    crop_type TEXT NOT NULL,
    status crop_status DEFAULT 'GROWING',
    sown_date DATE,
    ai_est_harvest_date DATE,
    ai_predicted_yield_kg NUMERIC(10, 2),
    ai_confidence_score NUMERIC(5, 2),
    actual_yield_kg NUMERIC(10, 2), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TELEMETRY LOGS
CREATE TABLE telemetry_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_cycle_id UUID NOT NULL REFERENCES crop_cycles(id) ON DELETE CASCADE,
    date_logged DATE NOT NULL DEFAULT CURRENT_DATE,
    ndvi_score NUMERIC(5, 4),
    avg_temp_celsius NUMERIC(5, 2),
    rainfall_mm NUMERIC(6, 2),
    soil_moisture_percent NUMERIC(5, 2),
    fungal_risk_factor NUMERIC(5, 2)
);

-- MARKETPLACE LISTINGS
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_cycle_id UUID NOT NULL REFERENCES crop_cycles(id) ON DELETE CASCADE,
    quantity_tons NUMERIC(10, 3) NOT NULL,
    floor_price_per_ton NUMERIC(12, 2) NOT NULL,
    quality_grade TEXT,
    status listing_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ESCROW ORDERS
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id),
    buyer_id UUID NOT NULL REFERENCES users(id),
    farmer_id UUID NOT NULL REFERENCES users(id),
    qty_purchased NUMERIC(10, 3) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    origin_lat NUMERIC(9, 6),
    origin_lng NUMERIC(9, 6),
    dest_lat NUMERIC(9, 6),
    dest_lng NUMERIC(9, 6),
    current_lat NUMERIC(9, 6),
    current_lng NUMERIC(9, 6),
    status order_status DEFAULT 'INITIATED',
    qr_delivery_hash TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    icon_type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. TRIGGERS
-- ==========================================
-- Attach updated_at triggers to all core tables
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farms_modtime BEFORE UPDATE ON farms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crop_cycles_modtime BEFORE UPDATE ON crop_cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listings_modtime BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Automatically create 'users' public profile when someone signs up via Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'AgroDirect User'), 'FARMER');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Dynamic Policies mapping strictly to Supabase Auth token (auth.uid())
CREATE POLICY "Users can read all public user profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can only update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view farmlands" ON farms FOR SELECT USING (true);
CREATE POLICY "Farmers can insert their own farms" ON farms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Farmers can update their own farms" ON farms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Farmers can delete their own farms" ON farms FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view crop cycles" ON crop_cycles FOR SELECT USING (true);
CREATE POLICY "Farmers can manage their crop cycles" ON crop_cycles FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM farms WHERE id = farm_id)
);

CREATE POLICY "Anyone can view telemetry logs" ON telemetry_logs FOR SELECT USING (true);
CREATE POLICY "System/Farmers can manage telemetry" ON telemetry_logs FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM farms f JOIN crop_cycles c ON f.id = c.farm_id WHERE c.id = crop_cycle_id)
);

CREATE POLICY "Anyone can view active listings" ON listings FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Farmers can manage their listings" ON listings FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM farms f JOIN crop_cycles c ON f.id = c.farm_id WHERE c.id = crop_cycle_id)
);

CREATE POLICY "Buyers and Farmers can view their own orders" ON orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);
CREATE POLICY "Buyers can initiate orders" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Participants can update orders" ON orders FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);

CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- 5. REALTIME SYSTEM SUBSCRIPTIONS
-- ==========================================
-- Transmits live WebSocket signals when orders move on the map or notifications deploy
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE telemetry_logs;
