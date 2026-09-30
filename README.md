# Liber

**Indonesia Web3 Hackathon 2026 · Finance & Commerce / Consumer Apps**

Liber is a self-custodial BNB Chain wallet prototype for Indonesia. The hosted BSC testnet demo scans QRIS codes, estimates their USDC equivalent, and demonstrates a confirmed MockUSDC transfer to another test wallet. MockUSDC has no monetary value and does not fund a real Kolo card or settle a merchant payment.

The proposed real-world payment route through Kolo and GoPay/DANA remains a hypothesis. Exact BSC token deposit support, account eligibility, and card-linked QRIS compatibility require provider confirmation and an end-to-end test before being offered as a working payment route.

**BNB live demo:** [web app](https://liber-bnb-web.vercel.app) · [API health](https://liber-bnb-api.vercel.app/health). The web app and Hono API run as separate Vercel projects; the API uses Neon Postgres.  
**Earlier Stellar demo video:** [watch on YouTube](https://youtu.be/tAt_Gn67OII). This recording predates the BNB migration and should not be presented as a BNB walkthrough. The [older Stellar site](https://liber-qris.vercel.app) remains available for comparison.  
**BSC testnet contract:** [MockUSDC at `0x2116D4a3f11Aa7059Ad0911ad5C89897CC0BcC97`](https://testnet.bscscan.com/address/0x2116D4a3f11Aa7059Ad0911ad5C89897CC0BcC97). This is a faucet-enabled test token, not a production stablecoin.

## The problem

Millions of Indonesians pay for everyday purchases through QRIS, but anyone holding their money in USDC or other crypto has no direct way to spend it there. Custodial exchanges hold the user's keys instead of the user. Off-ramping to a bank account is slow and fee-heavy. Not a single QRIS merchant accepts crypto directly. Today, spending crypto on daily life in Indonesia means selling it on an exchange, waiting for a bank transfer, then spending rupiah, a multi-day, multi-fee detour just to buy a coffee.

## What the demo proves

1. Create or connect an EVM wallet and authenticate by signing a Liber sign-in message.
2. Scan a QRIS payload and display a reference USDC quote.
3. Save a destination owned by the tester and transfer MockUSDC on BSC testnet.
4. Wait for confirmation and check the transaction on BscScan. The API verifies the token contract, sender, recipient, amount, and successful receipt before recording it.

The wallet signs transfers on the device. Liber does not execute a QRIS payment or confirm card credit.

## Architecture

This is a monorepo of two fully independent applications, each deployed separately, with no shared root package.json or workspace tooling:

```
frontend/   Next.js 16 (App Router) app, deployed as a separate Vercel project
backend/    Hono API, deployed as a separate Vercel project
contracts/  Foundry: MockUSDC for BSC testnet only
```

### Frontend

Mobile-first Next.js app: a bottom-nav app shell (Home, Scan, Profile, History) sitting behind a marketing landing page. Wallet keypairs are generated and held entirely client-side (`frontend/src/lib/wallet/`); the backend never sees a private key.

- Next.js 16, React 19, Tailwind v4
- `viem` for client-side EVM keypairs, signing and BSC RPC calls (local key, or any injected wallet such as MetaMask / Trust / Binance Web3 Wallet)
- `html5-qrcode` for QRIS scanning, `qrcode` for generating the receive-address QR

### Backend

A Hono API handling wallet authentication, registration, reference quotes, and activity logging. It checks the wallet gas balance before registration, never receives a private key, and does not fund accounts or relay transfers.

- Hono on `@hono/node-server`
- Postgres for user records and scan/top-up history
- `viem` for BSC reads (BNB gas balance for activation, USDC `balanceOf`)

## BNB Chain integration

BNB Smart Chain (BSC) is the settlement and custody layer end to end (testnet chainId 97 by default, mainnet 56):

- **Non-custodial wallets**: every user gets an EVM keypair generated and held client-side, or connects an injected wallet.
- **No trustline needed**: USDC is a BEP-20 token (Binance-Peg USDC on mainnet, 18 decimals; `contracts/MockUSDC` on testnet).
- **Activation**: the wallet only needs a little BNB (0.001) for gas; the backend registers it once that balance is seen on-chain.
- **Test transfers**: an ERC-20 `transfer` signed on-device and broadcast over BSC RPC. The hosted demo sends MockUSDC to a test wallet; it does not fund a Kolo card.
- **Live balance and quotes**: balances are read directly from BSC via `balanceOf`; tx links go to BscScan.

See [MIGRATION-BNB.md](MIGRATION-BNB.md) for what changed from the original Stellar build and how to deploy.

## Account and transaction security

- EIP-4361 sign-in challenges expire after five minutes. A valid signature consumes its nonce atomically, preventing concurrent replay.
- Random bearer sessions expire after 30 minutes; only SHA-256 token hashes are stored in Postgres. The browser keeps the session in sessionStorage. Log out revokes the current token.
- Registration, wallet lookup, balance, history, scans, saved destinations, and transfer logs require authentication. Each user route checks wallet ownership. Public health and reference quotes remain accessible.
- The API reads confirmed Transfer events from the configured chain and token; client-supplied amounts are checked against the receipt. A unique index prevents a transaction from being recorded twice.
- Historical top-up rows remain unverified. A verified test transfer still does not prove Kolo card credit or QRIS settlement.
- After broadcasting, the UI keeps the transaction hash and offers verification retry instead of prompting another transfer.

## Deployments

| Application | Live URL | Source directory |
|---|---|---|
| Web app | [liber-bnb-web.vercel.app](https://liber-bnb-web.vercel.app) | `frontend/` |
| API | [liber-bnb-api.vercel.app](https://liber-bnb-api.vercel.app/health) | `backend/` |

The API uses the `liber-bnb-db` Neon Free Postgres database in Singapore. Vercel injects its `DATABASE_URL` through the Neon integration; credentials are not stored in this repository. The database schema is in `backend/src/db/schema.sql`. The frontend targets BSC testnet (chain ID 97) and the API URL above. This is a testnet demo, not a production payment service.

| Network | Contract | Address |
|---|---|---|
| BSC testnet (97) | MockUSDC (18 dec, open `faucet()`/`mint()`) | [`0x2116D4a3f11Aa7059Ad0911ad5C89897CC0BcC97`](https://testnet.bscscan.com/address/0x2116D4a3f11Aa7059Ad0911ad5C89897CC0BcC97) |
| BSC mainnet (56) | Binance-Peg USDC (no deploy needed) | [`0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d`](https://bscscan.com/address/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d) |

Deploy record: `contracts/deployments/bsc-testnet.json`. Source is not verified on BscScan yet (no API key was available).

## Local development

Each app runs independently. Open two terminals.

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, USDC_ADDRESS
npm run migrate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # point NEXT_PUBLIC_BACKEND_URL at the backend above
npm run dev
```

Both apps have their own test suites (`npm test`) using Node's built-in test runner.

For an existing database, apply `backend/src/db/security-migration.sql` before deploying the authentication update. The migration is additive. Users with an old browser session must verify their wallet again.

## Hackathon tracks

- **Finance & Commerce:** a consumer payment flow that uses BNB Smart Chain for self-custodial USDC transfers.
- **Consumer Apps:** a mobile-first experience that connects a familiar QRIS scan to an on-chain wallet and existing payment apps.

