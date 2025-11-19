-- Migration: Align Supabase schema with code expectations
-- Created: 2025-11-18
-- Description: Add missing columns and fix discrepancies between DB schema and application code

-- =============================================================================
-- PROPERTIES TABLE UPDATES
-- =============================================================================

-- Add missing columns to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('apartment', 'house', 'commercial', 'land', 'other')),
ADD COLUMN IF NOT EXISTS floor INTEGER,
ADD COLUMN IF NOT EXISTS parking_spaces INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_elevator BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_furnished BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS coordinates JSONB,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Migrate data from property_type to type
UPDATE properties
SET type = CASE
  WHEN property_type = 'apartment' THEN 'apartment'
  WHEN property_type = 'house' THEN 'house'
  WHEN property_type = 'commercial' THEN 'commercial'
  WHEN property_type = 'land' THEN 'land'
  ELSE 'other'
END
WHERE type IS NULL AND property_type IS NOT NULL;

-- Copy latitude/longitude to coordinates JSONB
UPDATE properties
SET coordinates = jsonb_build_object('lat', latitude, 'lng', longitude)
WHERE coordinates IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Rename area_sqm to area for consistency
ALTER TABLE properties RENAME COLUMN area_sqm TO area;

-- Make city and state nullable (not all properties have complete address)
ALTER TABLE properties ALTER COLUMN city DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN state DROP NOT NULL;

-- =============================================================================
-- USERS TABLE UPDATES
-- =============================================================================

-- Add preferences column for user settings
ALTER TABLE users
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN users.preferences IS 'User preferences as JSONB: language, notifications settings, etc.';

-- =============================================================================
-- INSPECTIONS TABLE UPDATES
-- =============================================================================

-- Rename scheduled_at to scheduled_date for consistency with code
ALTER TABLE inspections RENAME COLUMN scheduled_at TO scheduled_date;

-- =============================================================================
-- INDEXES FOR NEW COLUMNS
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_has_elevator ON properties(has_elevator) WHERE has_elevator = TRUE;
CREATE INDEX IF NOT EXISTS idx_properties_is_furnished ON properties(is_furnished) WHERE is_furnished = TRUE;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN properties.type IS 'Property type: apartment, house, commercial, land, other';
COMMENT ON COLUMN properties.floor IS 'Floor number for apartments/commercial';
COMMENT ON COLUMN properties.parking_spaces IS 'Number of parking spaces';
COMMENT ON COLUMN properties.has_elevator IS 'Whether building has elevator';
COMMENT ON COLUMN properties.is_furnished IS 'Whether property is furnished';
COMMENT ON COLUMN properties.coordinates IS 'GPS coordinates as JSONB: {"lat": number, "lng": number}';
COMMENT ON COLUMN properties.thumbnail_url IS 'URL to property thumbnail image';
