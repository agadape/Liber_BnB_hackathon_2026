# Liber: Stellar to BNB Chain migration

Liber had no Soroban contracts (the `contracts/` folder was a deferred Passkey Kit placeholder). All the
Stellar logic lived in the frontend and backend, so this port swaps `@stellar/stellar-sdk` and
`@creit.tech/stellar-wallets-kit` for **viem** on **BNB Smart Chain**. BSC testnet (97) is the default,
and the hosted payment contracts are restricted to chain 97. Legacy wallet network configuration also supports chain 56; changing it does not activate the invoice or receipt contracts on mainnet.

## What changed

| Area | Stellar (before) | BNB Chain (after) |
|---|---|---|
| Wallet | Ed25519 keypair (`G…`/`S…`) | EVM keypair (`0x` address / `0x` private key), `frontend/src/lib/wallet/keypair.ts` |
| External wallet | Stellar Wallets Kit (Freighter, xBull…) | Any injected EIP-1193 wallet (MetaMask, Trust, Binance Web3, OKX…). Auto switches to or adds the BSC chain. `externalWallet.ts` |
| Signing | sign XDR, submit to Horizon | `sendActiveWallet()` signs locally with a viem `privateKeyToAccount`, or through the injected wallet, then broadcasts over BSC RPC |
| USDC | Classic asset + trustline (`changeTrust`) | BEP-20 ERC-20. No trustline, so the `confirm-trustline` route and flow were removed |
| Activation | ≥ 2 XLM reserve | ≥ 0.001 BNB for gas (`ACTIVATION_BALANCE_BNB`, same value in backend and frontend) |
| Test transfer | `payment` op + numeric `MEMO_ID` | ERC-20 `transfer` to a tester-controlled wallet. No validated Kolo deposit or QRIS settlement is claimed |
| Balance | Horizon account balances | `balanceOf` + `decimals()` on the USDC contract (`backend/src/chain/account.ts`) |
| Explorer | none | BscScan tx links in History and after a top-up (`frontend/src/lib/chain.ts`) |
| DB schema | `stellar_public_key`, `kolo_stellar_address`, `kolo_memo`, `stellar_tx_hash` | `wallet_address` (EIP-55), `kolo_address`, `tx_hash`. Written as a **fresh schema**, so use a new database |
| API | `POST /users {stellarPublicKey}`, `/users/by-key/:key`, `kolo-address {koloStellarAddress,koloMemo}`, `topups {stellarTxHash}` | `POST /users {walletAddress}` (returns `{userId}`), `/users/by-address/:walletAddress`, `kolo-address {koloAddress}`, `topups {txHash}` |
| Contracts | none | `LiberInvoice` for native merchant invoices and `MockUSDC` (18 decimals, open faucet), BSC Testnet only |
| Copy | "Built on Stellar", "Stellar address", etc. | BNB Chain across the app and README. The current demo video shows the BNB sandbox/testnet product. |

Env vars:
- backend: `CHAIN_ID`, `BSC_RPC_URL`, `USDC_ADDRESS`. These replace `STELLAR_NETWORK_PASSPHRASE`, `HORIZON_URL` and `USDC_ISSUER`.
- frontend: `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_BSC_RPC_URL`, `NEXT_PUBLIC_USDC_ADDRESS`, `NEXT_PUBLIC_USDC_DECIMALS`. These replace `NEXT_PUBLIC_HORIZON_URL`.

Mainnet USDC on BSC is Binance-Peg USDC `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` with **18 decimals**, not 6.

## Deploy to BSC testnet

1. Get test BNB from https://www.bnbchain.org/en/testnet-faucet.
2. Deploy MockUSDC. See `contracts/README.md`:
   `forge script script/DeployMockUSDC.s.sol --rpc-url bsc_testnet --broadcast --private-key $DEPLOYER_PRIVATE_KEY`
3. Backend: `cp .env.example .env`. Set `DATABASE_URL`, `CHAIN_ID=97` and `USDC_ADDRESS=<MockUSDC>`. Then run `npm i && npm run migrate && npm run dev`.
4. Frontend: `cp .env.local.example .env.local`. Set `NEXT_PUBLIC_USDC_ADDRESS=<MockUSDC>`. Then run `npm i && npm run dev`.
5. Onboard, send 0.001 test BNB to the shown address, then call `MockUSDC.faucet()` or `mint()` to fund the wallet with USDC.

Keep the hosted release on chain 97. Mainnet token transfers need a separate deployment and operational review; changing the wallet environment is not a production migration of LiberInvoice or LiberReceiptRegistry.

## Merchant QRIS pilot

The pilot adds separate `pilot_orders` and `pilot_receipts` tables and a `LiberReceiptRegistry` contract. Buyers pay IDR via Midtrans; the contract timestamps receipt hashes without moving funds or authenticating fiat settlement. Account setup and activation gates are in [PILOT.md](PILOT.md). Sandbox credentials and webhook are configured. A Rp10,000 connected-account sandbox payment and its BSC Testnet hash recording passed end to end on 1 October 2026; [portable evidence](contracts/deployments/pilot-sandbox-e2e.json) records the exact statement and transaction. Production activation remains pending; real payments are disabled.

## Hosted BSC testnet demo

- Frontend: [liber-bnb-web.vercel.app](https://liber-bnb-web.vercel.app), Vercel project `liber-bnb-web`, root directory `frontend/`.
- Backend: [liber-bnb-api.vercel.app](https://liber-bnb-api.vercel.app/health), Vercel project `liber-bnb-api`, root directory `backend/`. `src/app.ts` exports the Hono app for Vercel; `src/server.ts` remains the local Node entry point.
- Database: Neon Free Postgres resource `liber-bnb-db` in Singapore, connected to the backend through Vercel as `DATABASE_URL`. The base schema, authentication tables and additive product migration are deployed. Database credentials stay in Vercel/Neon.
- BSC testnet MockUSDC: [`0x2116D4a3f11Aa7059Ad0911ad5C89897CC0BcC97`](https://testnet.bscscan.com/address/0x2116D4a3f11Aa7059Ad0911ad5C89897CC0BcC97).

The hosted UI clearly labels BSC testnet and MockUSDC. Its proposed Kolo and GoPay/DANA route is unvalidated; demo transfers do not load a real card.

Before upgrading an existing deployment, apply `backend/src/db/security-migration.sql`. Authentication uses single-use five-minute SIWE challenges, 30-minute hashed sessions and wallet ownership checks on every user endpoint. Top-up receipts are checked on the configured BSC chain, and duplicate verified hashes are blocked. Existing top-up records retain `verified=false`.

The frontend uses `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_CHAIN_ID=97`, `NEXT_PUBLIC_BSC_RPC_URL`, `NEXT_PUBLIC_USDC_ADDRESS`, and `NEXT_PUBLIC_USDC_DECIMALS=18`. The backend uses `DATABASE_URL`, `FRONTEND_ORIGINS`, `CHAIN_ID=97`, `BSC_RPC_URL`, and `USDC_ADDRESS`. Keep production URLs in the matching Vercel projects and redeploy after changing environment variables. The Neon query editor accepts one SQL statement per execution when creating the schema manually.

GitHub Actions checks frontend tests, types, lint and build; backend tests and types against Postgres; and Foundry build and tests. The current 90-second BNB demo is https://youtu.be/WyFs-pF5AYM (English narration and subtitles). Historical Stellar recordings remain archived material.

## Merchant invoices and Payment Copilot

The current hosted product adds `/demo`, `/merchant`, `/checkout` and `/receipt` to the migrated wallet.
LiberInvoice is deployed at `0x2ad1785460b3c60b0131b0649b37dacf3dc17b1c` on BSC Testnet and transfers
MockUSDC directly from buyer to merchant. Its constructor and the invoice API require chain 97;
the original wallet's configurable mainnet support does not enable mainnet invoices.

Set `INVOICE_CONTRACT_ADDRESS` on the API and apply `backend/src/db/product-migration.sql` for
`copilot_usage` and `invoice_receipts`. QR inspection is deterministic. Optional Indonesian AI
explanations use Vercel server OIDC, redacted facts and a global 100-attempt daily limit.
Set `COPILOT_ENABLED=true` after AI Gateway credits are available; otherwise the app uses checked facts.
Live AI activation currently awaits user-completed free-credit verification.

See [README.md](README.md) for deployed evidence and [SUBMISSION.md](SUBMISSION.md) for the walkthrough.

## Remaining work

- **Real payment route validation.** Confirm the exact token contract/network, deposit attribution, card eligibility and GoPay/DANA QRIS compatibility with the providers. A testnet transfer is not a card top-up; switching token addresses alone does not validate a payment integration.
- Optional: sponsor gas or use an ERC-4337 paymaster so new users don't need to hold BNB.
- The historical docs (`LIBER-CONCEPT.md`, `BRIDGE-PATHS.md`, `RESEARCH-QRIS-RAILS.md`, `ideasubmission.md`, `.superpowers/`, legacy pitch deck PDF and archived demo videos) still describe the Stellar build and were left as-is.
