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

CREATE TABLE IF NOT EXISTS auth_challenges (
  nonce TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  message TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_challenges_wallet_idx ON auth_challenges(wallet_address);
CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_sessions_expiry_idx ON auth_sessions(expires_at);
-- Historical rows have no verified status. Only newly checked receipts are marked true.
ALTER TABLE kolo_topups ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE kolo_topups ADD COLUMN IF NOT EXISTS chain_id INTEGER;
ALTER TABLE kolo_topups ADD COLUMN IF NOT EXISTS token_address TEXT;
ALTER TABLE kolo_topups ADD COLUMN IF NOT EXISTS destination_address TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS kolo_topups_verified_tx_idx ON kolo_topups(chain_id, tx_hash) WHERE verified;
