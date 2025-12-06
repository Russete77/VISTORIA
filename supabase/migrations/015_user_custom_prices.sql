-- Migration 015: User Custom Prices
-- Created: 2025-12-02
-- Description: Allow users to customize service prices and track cost edits per problem

-- ================================================
-- USER CUSTOM PRICES TABLE
-- ================================================

-- Allows users to override default service prices
CREATE TABLE IF NOT EXISTS user_custom_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES repair_services(id) ON DELETE CASCADE,

  -- Custom prices (overrides base prices)
  custom_price_min DECIMAL(10,2) NOT NULL,
  custom_price_max DECIMAL(10,2) NOT NULL,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One custom price per user per service
  UNIQUE(user_id, service_id)
);

CREATE INDEX idx_user_custom_prices_user ON user_custom_prices(user_id);
CREATE INDEX idx_user_custom_prices_service ON user_custom_prices(service_id);

-- ================================================
-- ADD COST FIELDS TO PHOTO_PROBLEMS TABLE
-- ================================================

-- Store selected service, quantity and manual cost for each problem
ALTER TABLE photo_problems
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES repair_services(id),
ADD COLUMN IF NOT EXISTS quantity DECIMAL(10,2) DEFAULT 1,
ADD COLUMN IF NOT EXISTS manual_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS cost_notes TEXT,
ADD COLUMN IF NOT EXISTS cost_edited_at TIMESTAMPTZ;

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE user_custom_prices IS 'User-specific price overrides for repair services';
COMMENT ON COLUMN user_custom_prices.custom_price_min IS 'Minimum price override for this service';
COMMENT ON COLUMN user_custom_prices.custom_price_max IS 'Maximum price override for this service';
COMMENT ON COLUMN photo_problems.service_id IS 'Manually selected service for cost estimation';
COMMENT ON COLUMN photo_problems.quantity IS 'Quantity (m², units, etc.) for cost calculation';
COMMENT ON COLUMN photo_problems.manual_cost IS 'User-entered cost (overrides calculated cost)';
COMMENT ON COLUMN photo_problems.cost_notes IS 'Notes about the cost (e.g., quote from contractor)';
