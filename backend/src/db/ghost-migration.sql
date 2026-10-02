BEGIN;
CREATE TABLE IF NOT EXISTS ghost_vouchers (
 voucher_id TEXT NOT NULL CHECK(voucher_id ~ '^0x[0-9a-f]{64}$'),
 chain_id INTEGER NOT NULL CHECK(chain_id=97),
 vault_address TEXT NOT NULL CHECK(vault_address ~ '^0x[0-9a-f]{40}$'),
 token_address TEXT NOT NULL CHECK(token_address ~ '^0x[0-9a-f]{40}$'),
 owner_address TEXT NOT NULL CHECK(owner_address ~ '^0x[0-9a-f]{40}$'),
 merchant_address TEXT NOT NULL CHECK(merchant_address ~ '^0x[0-9a-f]{40}$'),
 amount_raw NUMERIC(78,0) NOT NULL CHECK(amount_raw>0 AND amount_raw<=1000000000000000000000),
 valid_before BIGINT NOT NULL CHECK(valid_before>0),
 salt TEXT NOT NULL CHECK(salt ~ '^0x[0-9a-f]{64}$'),
 reserve_tx_hash TEXT NOT NULL CHECK(reserve_tx_hash ~ '^0x[0-9a-f]{64}$'),
 observed_status TEXT NOT NULL CHECK(observed_status IN('reserved','redeemed','reclaimed')),
 checked_block_number BIGINT NOT NULL,checked_block_hash TEXT NOT NULL CHECK(checked_block_hash ~ '^0x[0-9a-f]{64}$'),checked_block_timestamp BIGINT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(chain_id,vault_address,voucher_id),UNIQUE(chain_id,vault_address,owner_address,salt),CHECK(owner_address<>merchant_address)
);
CREATE INDEX IF NOT EXISTS ghost_vouchers_owner_idx ON ghost_vouchers(owner_address,created_at DESC,voucher_id DESC);
CREATE TABLE IF NOT EXISTS ghost_proofs (
 chain_id INTEGER NOT NULL CHECK(chain_id=97),vault_address TEXT NOT NULL,voucher_id TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN('reserve','redeem','reclaim')),
 tx_hash TEXT NOT NULL CHECK(tx_hash ~ '^0x[0-9a-f]{64}$'),log_index INTEGER NOT NULL CHECK(log_index>=0),
 block_number BIGINT NOT NULL,block_hash TEXT NOT NULL CHECK(block_hash ~ '^0x[0-9a-f]{64}$'),
 confirmations INTEGER NOT NULL CHECK(confirmations>=12),canonical BOOLEAN NOT NULL DEFAULT true,verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(chain_id,vault_address,tx_hash,log_index),FOREIGN KEY(chain_id,vault_address,voucher_id) REFERENCES ghost_vouchers(chain_id,vault_address,voucher_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS ghost_proofs_canonical_action_idx ON ghost_proofs(chain_id,vault_address,voucher_id,action) WHERE canonical;
CREATE TABLE IF NOT EXISTS ghost_rate_limits (
 scope TEXT NOT NULL CHECK(scope IN('public_read','private_proof','owner_recovery')),
 identity_hash TEXT NOT NULL CHECK(identity_hash ~ '^[0-9a-f]{64}$'),window_start BIGINT NOT NULL CHECK(window_start>=0),
 hits BIGINT NOT NULL DEFAULT 1 CHECK(hits>0),expires_at TIMESTAMPTZ NOT NULL,
 PRIMARY KEY(scope,identity_hash,window_start)
);
CREATE INDEX IF NOT EXISTS ghost_rate_limits_expiry_idx ON ghost_rate_limits(expires_at);
COMMIT;
