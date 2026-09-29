# Liber

**Indonesia Web3 Hackathon 2026 · Finance & Commerce / Consumer Apps**

Liber is a self-custodial BNB Chain wallet that helps USDC holders pay at Indonesian QRIS merchants using existing card-linked payment apps. Users scan a QRIS code, see its price in USDC, top up their own Kolo Visa card with an on-chain BEP-20 transfer, then complete the QRIS payment in GoPay or DANA. Liber does not directly settle the merchant's QRIS payment.

**BNB demo status:** the BSC testnet contract is live, and the frontend, backend, and contract checks pass in CI. The BNB version of the frontend and backend still needs a public deployment.  
**Earlier Stellar demo:** [live app](https://liber-qris.vercel.app) · [video](https://youtu.be/tAt_Gn67OII). These links predate the BNB migration and should not be presented as a BNB demo.  
**BSC testnet contract:** [MockUSDC at `0x2116D4a3f11Aa7059Ad0911ad5C89897CC0BcC97`](https://testnet.bscscan.com/address/0x2116D4a3f11Aa7059Ad0911ad5C89897CC0BcC97). This is a faucet-enabled test token, not a production stablecoin.

## The problem

Millions of Indonesians pay for everyday purchases through QRIS, but anyone holding their money in USDC or other crypto has no direct way to spend it there. Custodial exchanges hold the user's keys instead of the user. Off-ramping to a bank account is slow and fee-heavy. Not a single QRIS merchant accepts crypto directly. Today, spending crypto on daily life in Indonesia means selling it on an exchange, waiting for a bank transfer, then spending rupiah, a multi-day, multi-fee detour just to buy a coffee.

## The solution

Liber closes that gap without inventing a new payment rail:

1. **Scan** any QRIS code. Liber reads the merchant and amount, and quotes the equivalent price in USDC instantly.
2. **Route** that USDC over BNB Smart Chain (BEP-20), seconds, cents in gas, to your own Kolo crypto Visa card.
3. **Pay** by opening GoPay or DANA, e-wallets that already support paying QRIS directly from a linked Visa card, scanning the same code, and paying.

Liber never touches the payment itself. It holds the user's own keys, quotes the price, and hands off to infrastructure that is already live and regulated: BNB Chain settlement, Kolo's card program, and GoPay/DANA's own card-linked QRIS payment feature. Nothing new has to be built or trusted at the settlement layer.

## Architecture

This is a monorepo of two fully independent applications, each deployed separately, with no shared root package.json or workspace tooling:

```
frontend/   Next.js 16 (App Router) app, ready for a separate Vercel deployment
backend/    Hono API server, ready for a separate Railway deployment
contracts/  Foundry: MockUSDC for BSC testnet only
```

### Frontend

Mobile-first Next.js app: a bottom-nav app shell (Home, Scan, Profile, History) sitting behind a marketing landing page. Wallet keypairs are generated and held entirely client-side (`frontend/src/lib/wallet/`); the backend never sees a private key.

- Next.js 16, React 19, Tailwind v4
- `viem` for client-side EVM keypairs, signing and BSC RPC calls (local key, or any injected wallet such as MetaMask / Trust / Binance Web3 Wallet)
- `html5-qrcode` for QRIS scanning, `qrcode` for generating the receive-address QR

### Backend

A small Hono API handling account bootstrapping, QRIS quotes, and activity logging. It never executes a payment; it only funds new accounts and relays what the client already signed.

- Hono on `@hono/node-server`
- Postgres for user records and scan/top-up history
- `viem` for BSC reads (BNB gas balance for activation, USDC `balanceOf`)

## BNB Chain integration

BNB Smart Chain (BSC) is the settlement and custody layer end to end (testnet chainId 97 by default, mainnet 56):

- **Non-custodial wallets**: every user gets an EVM keypair generated and held client-side, or connects an injected wallet.
- **No trustline needed**: USDC is a BEP-20 token (Binance-Peg USDC on mainnet, 18 decimals; `contracts/MockUSDC` on testnet).
- **Activation**: the wallet only needs a little BNB (0.001) for gas; the backend registers it once that balance is seen on-chain.
- **Kolo top-ups**: sending USDC to a user's Kolo BEP-20 deposit address is an ERC-20 `transfer` signed on-device and broadcast over BSC RPC.
- **Live balance and quotes**: balances are read directly from BSC via `balanceOf`; tx links go to BscScan.

See [MIGRATION-BNB.md](MIGRATION-BNB.md) for what changed from the original Stellar build and how to deploy.

## Deployments

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

## Hackathon tracks

- **Finance & Commerce:** a consumer payment flow that uses BNB Smart Chain for self-custodial USDC transfers.
- **Consumer Apps:** a mobile-first experience that connects a familiar QRIS scan to an on-chain wallet and existing payment apps.

