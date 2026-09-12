-- Fawaterak deposit tracking + balance transaction ledger
-- Run once in Neon SQL Editor or via ensureFawaterakTables() on app boot

CREATE TABLE IF NOT EXISTS "FawaterakDeposit" (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  amount           DECIMAL(10, 2) NOT NULL,
  status           TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
  kind             TEXT NOT NULL DEFAULT 'BALANCE_TOPUP',
  invoice_id       TEXT UNIQUE,
  invoice_key      TEXT,
  reference_number TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fawaterak_deposit_user_id ON "FawaterakDeposit"(user_id);
CREATE INDEX IF NOT EXISTS idx_fawaterak_deposit_status ON "FawaterakDeposit"(status);

CREATE TABLE IF NOT EXISTS "BalanceTransaction" (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  amount       DECIMAL(10, 2) NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
  source       TEXT NOT NULL,
  reference_id TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_balance_transaction_user_id ON "BalanceTransaction"(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transaction_reference ON "BalanceTransaction"(reference_id);
