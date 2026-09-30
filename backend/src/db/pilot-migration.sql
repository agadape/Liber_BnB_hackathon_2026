CREATE TABLE IF NOT EXISTS pilot_orders (
  id UUID PRIMARY KEY,
  owner_address TEXT NOT NULL,
  idempotency_key UUID NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('sandbox','production')),
  merchant_name TEXT NOT NULL,
  provider_order_id TEXT NOT NULL UNIQUE,
  provider_merchant_id TEXT NOT NULL,
  amount_idr INTEGER NOT NULL CHECK (amount_idr BETWEEN 1000 AND 10000000),
  status TEXT NOT NULL DEFAULT 'creating',
  provider_transaction_id TEXT,
  charge_claimed_at TIMESTAMPTZ,
  check_claimed_at TIMESTAMPTZ,
  provider_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_address,idempotency_key)
);
CREATE TABLE IF NOT EXISTS pilot_receipts (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES pilot_orders(id),
  provider_status TEXT NOT NULL,
  commitment TEXT NOT NULL UNIQUE,
  statement JSONB NOT NULL,
  chain_tx_hash TEXT UNIQUE,
  recorded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(order_id,provider_status)
);
