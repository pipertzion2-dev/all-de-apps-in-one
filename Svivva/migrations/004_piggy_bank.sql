-- Admin piggy bank: platform revenue ledger (works without Stripe sync)
CREATE TABLE IF NOT EXISTS platform_ledger_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'adjustment')),
  category TEXT,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'stripe', 'referral', 'marketplace')),
  external_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_ledger_created_at ON platform_ledger_entries(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_ledger_external_id ON platform_ledger_entries(external_id) WHERE external_id IS NOT NULL;
