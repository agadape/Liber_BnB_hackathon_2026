-- Additive upgrade for existing Liber databases. No user records are deleted.
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
