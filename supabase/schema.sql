-- VistorIA Pro - Database Schema
-- Created: November 2025
-- Description: Complete schema for VistorIA Pro SaaS platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

-- Users Table
-- Synced with Clerk via webhooks
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  image_url TEXT,

  -- Subscription & Credits
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pay_per_use', 'professional', 'business', 'enterprise')),
  credits INTEGER DEFAULT 1, -- Free tier gets 1 credit/month
  total_vistorias INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Properties Table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Property Info
  name TEXT NOT NULL, -- e.g., "Apartamento 302 - Edifício Central"
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,

  -- Coordinates (for map display)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Characteristics
  property_type TEXT CHECK (property_type IN ('apartment', 'house', 'commercial', 'land')),
  bedrooms INTEGER,
  bathrooms INTEGER,
  area_sqm DECIMAL(10, 2), -- m²
  year_built INTEGER,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Inspections Table
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  -- Inspection Info
  type TEXT NOT NULL CHECK (type IN ('move_in', 'move_out', 'periodic')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'signed')),

  -- Participants
  inspector_name TEXT,
  tenant_name TEXT,
  landlord_name TEXT,

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Report
  report_url TEXT, -- PDF download link
  report_generated_at TIMESTAMPTZ,

  -- Signatures (base64 canvas signatures)
  inspector_signature TEXT,
  tenant_signature TEXT,
  landlord_signature TEXT,

  -- AI Analysis Summary
  total_problems INTEGER DEFAULT 0,
  urgent_problems INTEGER DEFAULT 0,
  high_problems INTEGER DEFAULT 0,
  medium_problems INTEGER DEFAULT 0,
  low_problems INTEGER DEFAULT 0,

  -- Billing
  charged_credits INTEGER DEFAULT 1, -- How many credits this inspection used

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Inspection Photos Table
CREATE TABLE IF NOT EXISTS inspection_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Photo Info
  room_name TEXT NOT NULL, -- e.g., "Sala de Estar", "Cozinha", "Banheiro"
  room_category TEXT CHECK (room_category IN ('living_room', 'kitchen', 'bathroom', 'bedroom', 'hallway', 'balcony', 'garage', 'other')),

  -- Storage
  storage_path TEXT NOT NULL, -- Supabase Storage path
  thumbnail_path TEXT,
  file_size INTEGER, -- bytes

  -- AI Analysis
  ai_analyzed BOOLEAN DEFAULT FALSE,
  ai_analysis_at TIMESTAMPTZ,
  ai_has_problems BOOLEAN DEFAULT FALSE,
  ai_summary TEXT,
  ai_confidence DECIMAL(3, 2), -- 0.00 to 1.00

  -- User edits
  user_edited BOOLEAN DEFAULT FALSE,
  user_notes TEXT,

  -- Metadata
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Photo Problems Table (AI detected issues)
CREATE TABLE IF NOT EXISTS photo_problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES inspection_photos(id) ON DELETE CASCADE,
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,

  -- Problem Details
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'urgent')),
  location TEXT, -- Specific location within the photo
  suggested_action TEXT,

  -- AI Metadata
  ai_confidence DECIMAL(3, 2), -- 0.00 to 1.00

  -- User Validation
  user_confirmed BOOLEAN DEFAULT TRUE,
  user_dismissed BOOLEAN DEFAULT FALSE,
  user_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comparisons Table (Move-in vs Move-out)
CREATE TABLE IF NOT EXISTS comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  -- Inspections to compare
  move_in_inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  move_out_inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,

  -- AI Analysis
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  -- Results
  differences_detected INTEGER DEFAULT 0,
  new_damages INTEGER DEFAULT 0,
  estimated_repair_cost DECIMAL(10, 2), -- R$

  -- Report
  report_url TEXT,
  report_generated_at TIMESTAMPTZ,

  -- Billing
  charged_credits INTEGER DEFAULT 1,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comparison Differences Table
CREATE TABLE IF NOT EXISTS comparison_differences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comparison_id UUID NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,

  -- Photos being compared
  before_photo_id UUID REFERENCES inspection_photos(id) ON DELETE SET NULL,
  after_photo_id UUID REFERENCES inspection_photos(id) ON DELETE SET NULL,

  -- Difference Details
  room_name TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'urgent')),

  -- Damage Assessment
  is_new_damage BOOLEAN DEFAULT TRUE,
  is_natural_wear BOOLEAN DEFAULT FALSE,
  estimated_repair_cost DECIMAL(10, 2), -- R$

  -- Visual Markers (bounding boxes)
  markers JSONB, -- [{ x, y, width, height, label }]

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions Table (Billing history)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Stripe Info
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,

  -- Transaction Details
  type TEXT NOT NULL CHECK (type IN ('credit_purchase', 'subscription', 'add_on')),
  amount DECIMAL(10, 2) NOT NULL, -- R$
  currency TEXT DEFAULT 'BRL',

  -- Credits
  credits_purchased INTEGER,
  credits_before INTEGER,
  credits_after INTEGER,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),

  -- Product Info
  product_name TEXT,
  product_tier TEXT,

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Usage Table (Track every credit spent)
CREATE TABLE IF NOT EXISTS credit_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- What used the credit
  inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
  comparison_id UUID REFERENCES comparisons(id) ON DELETE SET NULL,

  -- Usage Details
  credits_used INTEGER NOT NULL,
  credits_before INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,

  -- Metadata
  reason TEXT, -- 'inspection', 'comparison', 'add_on'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Users
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);

-- Properties
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_status ON properties(status);

-- Inspections
CREATE INDEX idx_inspections_user_id ON inspections(user_id);
CREATE INDEX idx_inspections_property_id ON inspections(property_id);
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_inspections_type ON inspections(type);
CREATE INDEX idx_inspections_created_at ON inspections(created_at DESC);

-- Photos
CREATE INDEX idx_photos_inspection_id ON inspection_photos(inspection_id);
CREATE INDEX idx_photos_user_id ON inspection_photos(user_id);
CREATE INDEX idx_photos_room_name ON inspection_photos(room_name);

-- Problems
CREATE INDEX idx_problems_photo_id ON photo_problems(photo_id);
CREATE INDEX idx_problems_inspection_id ON photo_problems(inspection_id);
CREATE INDEX idx_problems_severity ON photo_problems(severity);

-- Comparisons
CREATE INDEX idx_comparisons_user_id ON comparisons(user_id);
CREATE INDEX idx_comparisons_property_id ON comparisons(property_id);

-- Transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Credit Usage
CREATE INDEX idx_credit_usage_user_id ON credit_usage(user_id);
CREATE INDEX idx_credit_usage_created_at ON credit_usage(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_differences ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;

-- Users Policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (clerk_id = auth.jwt() ->> 'sub');

-- Properties Policies
CREATE POLICY "Users can view own properties"
  ON properties FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can create own properties"
  ON properties FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own properties"
  ON properties FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete own properties"
  ON properties FOR DELETE
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Inspections Policies
CREATE POLICY "Users can view own inspections"
  ON inspections FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can create own inspections"
  ON inspections FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own inspections"
  ON inspections FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete own inspections"
  ON inspections FOR DELETE
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Photos Policies
CREATE POLICY "Users can view own photos"
  ON inspection_photos FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can create own photos"
  ON inspection_photos FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own photos"
  ON inspection_photos FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete own photos"
  ON inspection_photos FOR DELETE
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Photo Problems Policies
CREATE POLICY "Users can view own photo problems"
  ON photo_problems FOR SELECT
  USING (inspection_id IN (SELECT id FROM inspections WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')));

CREATE POLICY "Users can create own photo problems"
  ON photo_problems FOR INSERT
  WITH CHECK (inspection_id IN (SELECT id FROM inspections WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')));

CREATE POLICY "Users can update own photo problems"
  ON photo_problems FOR UPDATE
  USING (inspection_id IN (SELECT id FROM inspections WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')));

-- Comparisons Policies
CREATE POLICY "Users can view own comparisons"
  ON comparisons FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can create own comparisons"
  ON comparisons FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Comparison Differences Policies
CREATE POLICY "Users can view own comparison differences"
  ON comparison_differences FOR SELECT
  USING (comparison_id IN (SELECT id FROM comparisons WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')));

-- Transactions Policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Credit Usage Policies
CREATE POLICY "Users can view own credit usage"
  ON credit_usage FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers: Auto-update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at
  BEFORE UPDATE ON inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON inspection_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at
  BEFORE UPDATE ON photo_problems
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Reset free tier credits monthly
CREATE OR REPLACE FUNCTION reset_free_tier_credits()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET credits = 1
  WHERE tier = 'free'
  AND credits = 0;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STORAGE BUCKETS (Run manually in Supabase Dashboard)
-- =============================================================================

-- Create storage bucket for inspection photos
-- INSERT INTO storage.buckets (id, name, public) VALUES ('inspection-photos', 'inspection-photos', false);

-- Create storage bucket for reports
-- INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false);

-- Storage policies (users can only access their own files)
-- CREATE POLICY "Users can upload own photos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'inspection-photos' AND auth.uid() = owner);

-- CREATE POLICY "Users can view own photos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'inspection-photos' AND auth.uid() = owner);

-- =============================================================================
-- SEED DATA (Optional - for development)
-- =============================================================================

-- Add a test user (replace with actual Clerk user ID)
-- INSERT INTO users (clerk_id, email, full_name, tier, credits)
-- VALUES ('user_test123', 'test@example.com', 'Test User', 'free', 1);
