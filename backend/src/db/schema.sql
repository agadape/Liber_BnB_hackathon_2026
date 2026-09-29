-- Liber on BNB Chain (BSC). Fresh schema: wallets are EVM addresses (EIP-55
-- checksummed), Kolo top-ups are ERC-20 USDC transfers identified by tx hash.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  kolo_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qris_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  merchant_name TEXT NOT NULL,
  merchant_city TEXT NOT NULL,
  amount_idr NUMERIC NOT NULL,
  amount_usdc NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS qris_scans_user_id_idx ON qris_scans(user_id);

CREATE TABLE IF NOT EXISTS kolo_topups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount_usdc NUMERIC NOT NULL,
  tx_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kolo_topups_user_id_idx ON kolo_topups(user_id);

-- Legacy table from an earlier pivot; keep the drop so the migration stays idempotent.
DROP TABLE IF EXISTS orders;
