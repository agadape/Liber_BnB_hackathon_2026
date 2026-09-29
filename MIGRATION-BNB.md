# Liber: Stellar to BNB Chain migration

Liber had no Soroban contracts (the `contracts/` folder was a deferred Passkey Kit placeholder). All the
Stellar logic lived in the frontend and backend, so this port swaps `@stellar/stellar-sdk` and
`@creit.tech/stellar-wallets-kit` for **viem** on **BNB Smart Chain**. BSC testnet (97) is the default,
and mainnet (56) is chosen with an env var.

## What changed

| Area | Stellar (before) | BNB Chain (after) |
|---|---|---|
| Wallet | Ed25519 keypair (`G…`/`S…`) | EVM keypair (`0x` address / `0x` private key), `frontend/src/lib/wallet/keypair.ts` |
| External wallet | Stellar Wallets Kit (Freighter, xBull…) | Any injected EIP-1193 wallet (MetaMask, Trust, Binance Web3, OKX…). Auto switches to or adds the BSC chain. `externalWallet.ts` |
| Signing | sign XDR, submit to Horizon | `sendActiveWallet()` signs locally with a viem `privateKeyToAccount`, or through the injected wallet, then broadcasts over BSC RPC |
| USDC | Classic asset + trustline (`changeTrust`) | BEP-20 ERC-20. No trustline, so the `confirm-trustline` route and flow were removed |
| Activation | ≥ 2 XLM reserve | ≥ 0.001 BNB for gas (`ACTIVATION_BALANCE_BNB`, same value in backend and frontend) |
| Kolo top-up | `payment` op + numeric `MEMO_ID` | ERC-20 `transfer` to the user's Kolo BEP-20 deposit address. The memo was dropped because EVM has none |
| Balance | Horizon account balances | `balanceOf` + `decimals()` on the USDC contract (`backend/src/chain/account.ts`) |
| Explorer | none | BscScan tx links in History and after a top-up (`frontend/src/lib/chain.ts`) |
| DB schema | `stellar_public_key`, `kolo_stellar_address`, `kolo_memo`, `stellar_tx_hash` | `wallet_address` (EIP-55), `kolo_address`, `tx_hash`. Written as a **fresh schema**, so use a new database |
| API | `POST /users {stellarPublicKey}`, `/users/by-key/:key`, `kolo-address {koloStellarAddress,koloMemo}`, `topups {stellarTxHash}` | `POST /users {walletAddress}` (returns `{userId}`), `/users/by-address/:walletAddress`, `kolo-address {koloAddress}`, `topups {txHash}` |
| Contracts | none | `contracts/` Foundry project with `MockUSDC` (18 decimals, open faucet) for testnet only |
| Copy | "Built on Stellar", "Stellar address", etc. | BNB Chain across the app and README. The recorded video still shows the earlier Stellar build. |

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

For mainnet, set `CHAIN_ID=56` and `NEXT_PUBLIC_CHAIN_ID=56`, set the RPC to `https://bsc-dataseed.bnbchain.org`, and set the USDC address to `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d`.

## Hosted BSC testnet demo

- Frontend: [liber-bnb-web.vercel.app](https://liber-bnb-web.vercel.app), Vercel project `liber-bnb-web`, root directory `frontend/`.
- Backend: [liber-bnb-api.vercel.app](https://liber-bnb-api.vercel.app/health), Vercel project `liber-bnb-api`, root directory `backend/`. `src/app.ts` exports the Hono app for Vercel; `src/server.ts` remains the local Node entry point.
- Database: Neon Free Postgres resource `liber-bnb-db` in Singapore, connected to the backend through Vercel as `DATABASE_URL`. The three tables and two indexes from `backend/src/db/schema.sql` were created and checked in the Neon query editor. Database credentials stay in Vercel/Neon.
- BSC testnet MockUSDC: [`0x2116D4a3f11Aa7059Ad0911ad5C89897CC0BcC97`](https://testnet.bscscan.com/address/0x2116D4a3f11Aa7059Ad0911ad5C89897CC0BcC97).

The frontend uses `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_CHAIN_ID=97`, `NEXT_PUBLIC_BSC_RPC_URL`, `NEXT_PUBLIC_USDC_ADDRESS`, and `NEXT_PUBLIC_USDC_DECIMALS=18`. The backend uses `DATABASE_URL`, `FRONTEND_ORIGINS`, `CHAIN_ID=97`, `BSC_RPC_URL`, and `USDC_ADDRESS`. Keep production URLs in the matching Vercel projects and redeploy after changing environment variables. The Neon query editor accepts one SQL statement per execution when creating the schema manually.

GitHub Actions checks frontend tests, types, lint and build; backend tests and types against Postgres; and Foundry build and tests. The video at https://youtu.be/tAt_Gn67OII is from the earlier Stellar version.

## TODO

- **Kolo on BNB Chain.** Confirm that Kolo accepts USDC (or USDT) deposits on BSC/BEP-20, and whether it needs a per-user address or some attribution that replaces the old Stellar memo. If Kolo only takes USDT on BSC, point `USDC_ADDRESS` at USDT (`0x55d398326f99059fF775485246999027B3197955`, 18 decimals) and rename the UI labels.
- Optional: sponsor gas or use an ERC-4337 paymaster so new users don't need to hold BNB.
- The historical docs (`LIBER-CONCEPT.md`, `BRIDGE-PATHS.md`, `RESEARCH-QRIS-RAILS.md`, `ideasubmission.md`, `.superpowers/`, pitch deck PDF, recorded demo videos) still describe the Stellar build and were left as-is.

