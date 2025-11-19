-- Create credit_transactions table for VistorIA Pro
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_stripe_session ON credit_transactions(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- Add credit_history view for easier queries
CREATE OR REPLACE VIEW credit_history AS
SELECT
  ct.id,
  ct.user_id,
  ct.type,
  ct.amount,
  ct.description,
  ct.created_at,
  CASE
    WHEN ct.type = 'credit' THEN ct.amount
    WHEN ct.type = 'debit' THEN -ct.amount
  END as balance_change,
  SUM(
    CASE
      WHEN ct.type = 'credit' THEN ct.amount
      WHEN ct.type = 'debit' THEN -ct.amount
    END
  ) OVER (PARTITION BY ct.user_id ORDER BY ct.created_at, ct.id) as running_balance
FROM credit_transactions ct
ORDER BY ct.created_at DESC;

-- Grant permissions
GRANT SELECT ON credit_history TO authenticated;
GRANT SELECT, INSERT ON credit_transactions TO authenticated;

COMMENT ON TABLE credit_transactions IS 'Tracks all credit purchases and usage by users';
COMMENT ON COLUMN credit_transactions.type IS 'Type of transaction: credit (purchase) or debit (usage)';
COMMENT ON COLUMN credit_transactions.amount IS 'Number of credits in this transaction';
COMMENT ON COLUMN credit_transactions.description IS 'Human-readable description of the transaction';
