# liber:Ghost Protocol — implementation and operations

## Protocol identity

Product name: `liber:Ghost Protocol`. Technical EIP-712 name: `LiberGhost`, version `1`, primary type `GhostVoucher`, chain ID `97`. Changing the display brand must never change these values for existing vouchers.

Vault: `0x0837ac35ec54F678ba08912dcfd6166a299FCA31`; deployment block `134372464`. Token: `0x2116D4a3f11Aa7059Ad0911ad5C89897CC0BcC97`, exactly 18 decimals. Check the public deployment manifest and source verification result before configuring a build.

No upgrade, administrator withdrawal, fee, early cancellation or transfer of voucher ownership exists. EOA signatures only. Smart and delegated wallets are not supported by the UI. Maximum reservation is 1,000 MockUSDC; contract validity is 300–604,800 seconds from inclusion.

## Settlement rules

- `reserve(voucher)` is signed by the owner as an EVM transaction. **It contains no voucher signature.** Exact tokens enter the vault.
- The paper packet contains owner authorization; it is a sensitive capability before handover.
- `redeem(voucher, signature)` can be called only by the named merchant before expiry. Signature becomes public in this transaction. Exact tokens leave the vault to the merchant.
- `reclaim(id)` can be called only by the owner at or after expiry while still reserved. No signature or QR is needed.
- Terminal states never reopen; owner + salt cannot be reused.
- Require 12 observed confirmations, canonical block hash, matching vault event and exact ERC20 Transfer. Confirmation depth is a policy, not an absolute finality guarantee. Live state is always checked again.

## Files and generated sources

`protocol/ghost-v1.json` and `protocol/templates/{codec,chain}.ts` are canonical. Run `node scripts/generate-ghost-protocol.mjs`; check drift with `--check`. Both applications receive identical codec/verification rules. After contract compilation run `node scripts/generate-ghost-abi.mjs`. `protocol/fixtures/ghost-v1-golden.json` uses a publicly known test key that must NEVER receive funds.

QR is `liber-ghost:v1:` plus canonical unpadded base64url of 416 ABI bytes: version, chain, trusted vault, voucher and normalized 65-byte signature. The golden packet is 570 characters. Reject links, QRIS, alternate vault/chain/version, noncanonical ABI/base64/signature, altered fields and invalid owner recovery. No scanned URL, address, RPC or arbitrary calldata becomes trusted configuration.

## Local verification

```powershell
cd frontend
npm ci
npm test
npm run typecheck
npm run lint
npm run build
cd ../contracts
forge install --no-git OpenZeppelin/openzeppelin-contracts@v5.0.2 foundry-rs/forge-std@v1.9.7
forge test
cd ../backend
npm ci
npm run typecheck
# Point DATABASE_URL at a disposable local Postgres database, never production.
npm run migrate
npm test
```

GitHub CI uses a disposable PostgreSQL service for the API suite. Frontend tests cover malicious packets, signature recovery, proof forgery, confirmation/stale-head handling and signature/journal separation. Foundry includes fuzz and handler-based invariants for liabilities, merchant transfers and terminal states.

## Database and hosting

`backend/src/db/ghost-migration.sql` adds only `ghost_vouchers`, `ghost_proofs`, `ghost_rate_limits` and indexes. It does not alter old tables or data. Apply in staging, inspect constraints, then apply to the existing sandbox database. Do not run the test suite against the shared hosted database: old tests intentionally clean up their own fixtures.

Backend variables are in `.env.example`. Generate a server-only `GHOST_SERVER_HMAC_SECRET` of 32+ random bytes encoded as hex. It protects cursor integrity and pseudonymous durable rate buckets; it is not a wallet key. Never expose it in frontend/public artifacts. Keep `GHOST_ENABLED=false` until migration, configuration and verification gates pass.

Frontend receives only public `NEXT_PUBLIC_GHOST_*` deployment values. Initially set `NEXT_PUBLIC_GHOST_ENABLED=false`. API and frontend must agree on network, vault, token and confirmation policy. UI checks deployed token, decimals and EIP-5267 domain. Direct RPC fallback permits chain verification when metadata is unavailable; never invent a proof from a database row.

Disabling issuance prevents creating, exporting and redeeming vouchers through this UI. It does not revoke already signed authorizations on the immutable contract. Keep the trusted deployment configuration present: existing owners retain state/proof checks and can reclaim expired reservations even with issuance disabled. Wrong network or deployment identity always blocks recovery transactions. Backend metadata verification remains available with a valid deployment and server HMAC secret. The Neon integration may provide `DATABASE_POSTGRES_PRISMA_URL` or `DATABASE_POSTGRES_URL`; an explicit `DATABASE_URL` takes precedence.

Deployment order: backend additive schema → disabled backend preview → disabled frontend preview → identity checks → E2E and UI checks → preview enable → hosted checks → production enable. Keep the old invoice and registry addresses intact.

## API contract

| Method | Route | Policy |
|---|---|---|
| GET | `/ghost/config` | Public, no secrets |
| GET | `/ghost/vouchers/:id` | Live chain state; rechecked cached proofs; 30/min IP |
| POST | `/ghost/reservations/verify` | SIWE owner; only voucher fields + txHash; 10/min wallet |
| POST | `/ghost/vouchers/:id/proofs` | SIWE merchant for redeem, owner for reclaim; action + txHash |
| GET | `/ghost/me/vouchers` | SIWE owner, 20-row cursor pages |
| POST | `/ghost/me/recover` | SIWE owner; signed bounded cursor; indexed owner logs; 2/min |

202 means confirmations pending; it must never produce a paid state. Terminal proof metadata requires reservation sync first. Metadata can fail without reversing a confirmed on-chain transfer. Store no voucher signature, raw QR, private key or raw wallet request. Do not log viem exception objects from signing/redeem; their arguments can contain the signature.

Recovery scans at most 1,000 blocks and verifies at most five events per request. An authenticated block/log-index continuation handles dense blocks without skipping a voucher. The initial scan upper bound leaves 12 confirmations; every recovered receipt is independently checked and must belong to the authenticated owner. Owner history has a 20-row page and at most three concurrent voucher reads.

The hosted Ghost API branch domain is public through one Vercel Unprotected Domain exception. Project-wide Vercel authentication remains enabled. SIWE still protects owner and merchant writes/history. The frontend preview remains behind team login. Neither feature flags nor this exception promote the branch to production.

## Transaction recovery

- Persist public transaction hashes immediately after broadcast. Unknown result means check the saved hash, never automatically resend.
- A repriced same-content transaction updates its saved hash. Cancellation or changed replacement requires inspection.
- Local journal holds unsigned fields and hashes. Signature is sessionStorage only and cleared on sign-out/wallet selection. React sensitive state is also cleared.
- Restore from local journal or verified reserve event. Owner can re-sign exactly the original domain/message without reserving again.
- Lost QR/browser state does not destroy the reservation. Recover using the reserve hash or bounded authenticated log recovery.
- Lost original private key is not recoverable by Liber. No support administrator can withdraw funds.
- If an approval reverts, inspect it. If a reserve expires before inclusion, its transaction reverts; a new expiry requires explicit new review/signature. Never silently mutate signed fields.

## Reproducible actual testnet evidence

`frontend/scripts/deploy-ghost.mjs` reads the existing dedicated project key locally, checks its public address and chain, caps deployment fee, and persists the public deployment hash before waiting. It refuses to deploy twice if a manifest exists.

`frontend/scripts/ghost-e2e.mts` has separate prepare/redeem/reclaim processes. Fresh test-wallet keys and the handover packet stay in local `outputs/ghost/` outside the repository. Redemption reads only the merchant key. Reports contain public hashes, fields and proof, never the packet/signature/key. Preparation gas funding is at most 0.002 TEST BNB total.

```powershell
cd frontend
node --import tsx scripts/ghost-e2e.mts prepare <dedicated-project-wallet-state-path>
# Buyer process has exited; do not reopen it for redemption.
node --import tsx scripts/ghost-e2e.mts redeem
# After the second voucher's expiry:
node --import tsx scripts/ghost-e2e.mts reclaim
```

Public report must distinguish these automated testnet proofs from a **physical phone-off test**. For that final test: issue through UI, export only after funding checks, print, turn the buyer phone off, scan with the online merchant, approve once, show exact confirmed transfer, scan the same paper again, then show expiry/reclaim on a second voucher. Record English narration with truthful labels. The previous video is not evidence for Ghost.

`contracts/deployments/ghost-ui-e2e.json` records a separate hosted UI run using two browser-origin device wallets. The buyer page was closed before merchant redemption, 5 MockUSDC transferred and the same PNG was rejected on a second scan. `frontend/scripts/ghost-ui-check.mts` rechecks only public receipts. This is not physical phone-off or printed-paper evidence. The Save QR download event and mobile viewport could not be verified through the automation; real device/print checks remain pending.

`frontend/scripts/ghost-hosted-check.mts` uses only the project's fixed sandbox origins, dedicated local test-wallet keys and SIWE messages. It never reads the Ghost handover packet. It checks auth, concurrent/idempotent metadata, public canonical proofs and bounded owner recovery, then revokes its sessions. `ghost-hosted-check.json` contains no session tokens or signatures.

## Release blockers

- Wrong token/vault/domain, missing source/runtime identity, failing tests or insufficient confirmations.
- QR export before funding, signature in reserve/backend/URL/analytics, or stale proof shown as successful.
- Automatic resend after timeout, merchant claim from another account, owner reclaim before expiry.
- API signature acceptance, owner authorization bypass, noncanonical proof accepted or mutation of existing data.
- Physical paper readability and responsive/wallet browser checks not performed must remain explicit pending checks.
- No mainnet, real-money QRIS, automatic crypto/IDR conversion, legal-compliance certification or goods-delivery claim.

## Operational limitations

The buyer prepares while online; the merchant remains online and pays TEST BNB. Contract funds are locked until merchant redemption or expiry + owner reclaim. Printing/downloading can produce copies; they remain fixed to one merchant and one claim. Treat an active QR as authorization, not an ordinary invoice URL. RPC and browser integrity remain assumptions; this MVP has not undergone an independent security audit.
