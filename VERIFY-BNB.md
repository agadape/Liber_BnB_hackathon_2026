# Liber: BNB Chain verification (2026-09-25)

**Verdict: works on a BSC testnet fork.** The contract, backend (with Postgres), frontend and the on-chain top-up path were all exercised against an anvil fork of BSC testnet (chain 97). No real-network writes were made.

## Checks

| Check | Result | Notes |
|---|---|---|
| `forge build` | PASS | solc 0.8.24 |
| `forge test` | PASS (3/3) | The project had no tests. Added `contracts/test/MockUSDC.t.sol` covering decimals, faucet, a transfer to a Kolo address, and mint. |
| Fork deploy | PASS | Ran `forge script script/DeployMockUSDC.s.sol --broadcast` against the chain-97 fork. MockUSDC deployed with code present and `decimals()=18`. |
| Core flow (cast) | PASS | `faucet()`, `mint()` and `transfer()` all succeeded, and the balances matched. |
| Backend typecheck + tests | PASS | `tsc --noEmit` is clean. `npm test` passes **42/42**, including the Postgres route tests (the migration doc said those had never been run), against local Homebrew Postgres 16 in a throwaway DB. |
| Backend migrate + run | PASS | `migrate` ran and the server started on :3141 with `CHAIN_ID=97`, `BSC_RPC_URL`=fork and `USDC_ADDRESS`=MockUSDC. |
| Backend on-chain reads | PASS | **Activation gate:** `POST /users` for a new address with 0 BNB returned `202 awaiting_funding`; after sending 0.002 BNB on the fork it returned `201 {userId}`. **Balance:** `GET /users/:id/balance` read the MockUSDC `balanceOf`/`decimals` from the fork correctly (`15` → `12` after a transfer, with an IDR estimate from CoinGecko). |
| Backend full flow | PASS | `/quote` → on-chain USDC `transfer` to the Kolo address → `POST /users/:id/kolo-address`, `/topups {txHash}` and `/scans` → `GET /history` returned both entries. `/users/by-address/:addr` works, and CORS allows the configured origin. |
| Frontend typecheck / tests / build | PASS | `tsc` is clean, `npm test` passes 29/29, and `next build` builds 12 static routes. |
| Frontend run | PASS | `next start -p 3140` returned 200 on `/`, `/onboarding`, `/home`, `/pay`, `/history`, `/profile`, `/settings` and `/terms`. The HTML has no Stellar or chain-mismatch strings, and the fork RPC and MockUSDC address are inlined in the bundle. |
| Frontend signing path | PASS | The real `buildTopUpTx()` and `sendWithLocalKey()` from `src/lib/wallet` signed and broadcast a 1.5 USDC transfer on the fork (chain 97), and the receiver balance went up. |
| Address checks (BSC mainnet, read-only) | PASS | Binance-Peg USDC `0x8AC76a51…580d` has code, `decimals=18`, symbol USDC. USDT `0x55d39832…7955` has code, `decimals=18`. |
| External wallet (MetaMask etc.) in a browser | SKIPPED | Needs a browser wallet. The injected-wallet code typechecks, but a person has to click through it. |

## Bugs fixed

1. **The root `.gitignore` ignored the whole `contracts/` folder.** This was a leftover from the Stellar era ("deferred, inactive feature notes"), and it meant MockUSDC and its deploy script would never be committed. I removed that entry. `contracts/.gitignore` already excludes `lib/`, `out/`, `cache/`, `broadcast/` and `.env`.
2. Added `.env.fork` to `backend/.gitignore`. The local fork env file is kept at `backend/.env.fork`. It contains no secrets.
3. Added a MockUSDC test suite, since `forge test` previously found no tests.

## Known limitations (not changed)

- `POST /users/:id/topups` stores the client-supplied `txHash` and `amountUsdc` without checking the receipt on-chain. This was also true of the Stellar version. Consider adding a `getTransactionReceipt` check for the `Transfer` log before trusting it.
- New users need about 0.001 BNB for gas (`ACTIVATION_BALANCE_BNB`), and nothing sponsors it.

## Reproduce (fork)

```bash
anvil --fork-url https://bsc-testnet-rpc.publicnode.com --chain-id 97 --port 8640
cd contracts && forge script script/DeployMockUSDC.s.sol --rpc-url http://127.0.0.1:8640 --broadcast --private-key <anvil key 0>
createdb liber_fork
# backend/.env.fork: DATABASE_URL=postgres://localhost:5432/liber_fork PORT=3141 CHAIN_ID=97
#   BSC_RPC_URL=http://127.0.0.1:8640 USDC_ADDRESS=<MockUSDC> FRONTEND_ORIGINS=http://localhost:3140
cd backend && npm ci && set -a && . ./.env.fork && set +a && npx tsx src/db/migrate.ts && npm test && npx tsx src/server.ts
# frontend/.env.local: NEXT_PUBLIC_BACKEND_URL=http://localhost:3141 NEXT_PUBLIC_CHAIN_ID=97
#   NEXT_PUBLIC_BSC_RPC_URL=http://127.0.0.1:8640 NEXT_PUBLIC_USDC_ADDRESS=<MockUSDC> NEXT_PUBLIC_USDC_DECIMALS=18
cd frontend && npm ci && npx next build && npx next start -p 3140
```

I removed the node_modules I installed and the fork `.env.local` afterwards to keep the project under 500MB.

## Steps left for a real BSC testnet deploy

1. **Key and funds.** You need one deployer EOA with about **0.01 tBNB**. The MockUSDC deploy is about 0.9M gas, which is well under 0.005 tBNB at testnet gas prices. Get tBNB from https://www.bnbchain.org/en/testnet-faucet.
2. Run `cd contracts && forge script script/DeployMockUSDC.s.sol --rpc-url bsc_testnet --broadcast --private-key $DEPLOYER_PRIVATE_KEY`. Set `BSC_TESTNET_RPC_URL` in the env, because `foundry.toml` reads it. Optionally verify with `BSCSCAN_API_KEY`.
3. **Postgres.** Provision a fresh database, for example on Railway. Don't reuse the Stellar database, because the schema is incompatible. Then run `npm run migrate`.
4. **Backend env.** Set `DATABASE_URL`, `CHAIN_ID=97`, `BSC_RPC_URL`, `USDC_ADDRESS=<MockUSDC>` and `FRONTEND_ORIGINS=<frontend URL>`.
5. **Frontend env.** Set `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_CHAIN_ID=97`, `NEXT_PUBLIC_USDC_ADDRESS=<MockUSDC>` and `NEXT_PUBLIC_USDC_DECIMALS=18`.
6. **Test users.** Each test user needs about 0.001 tBNB for gas, plus `MockUSDC.faucet()`.
7. **Mainnet.** No contract deploy is needed. Set chain 56 and USDC `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d`. Also confirm that Kolo accepts BEP-20 USDC (or USDT) deposits.

## Real BSC Testnet deploy (2026-09-25)

Deployed to real BSC testnet (chain 97) from the group deployer `0xE2D654a82893c5F97A40332D0f0ACb6Ad34318b5` with the project's own `forge script script/DeployMockUSDC.s.sol`.

| Item | Value |
|---|---|
| MockUSDC | [`0x2116D4a3f11Aa7059Ad0911ad5C89897CC0BcC97`](https://testnet.bscscan.com/address/0x2116D4a3f11Aa7059Ad0911ad5C89897CC0BcC97) |
| Deploy tx | [`0xf1b79167…1941`](https://testnet.bscscan.com/tx/0xf1b791670032e6fc7d0d1b1afe8d6720d2d89dd38de51bfa5e5215e734451941) |
| BscScan source verification | Skipped (no `BSCSCAN_API_KEY`/`ETHERSCAN_API_KEY` in env) |
| Gas spent (deploy + smoke) | ~0.000106 tBNB (gas price 0.1 gwei) |

Records: `contracts/deployments/bsc-testnet.json` and `contracts/broadcast/DeployMockUSDC.s.sol/97/run-latest.json`. The address is filled into `backend/.env.example` and `frontend/.env.local.example`. `backend/.env.bsc-testnet` (gitignored, no secrets) holds the local test config.

### Smoke flow on real testnet (cast)

| Step | Tx | Result |
|---|---|---|
| `faucet()` | [`0xa3926a9e…d7e5`](https://testnet.bscscan.com/tx/0xa3926a9e0b864e501c77fc2b06a9de32be8e1639e7795c3e440c7835da09d7e5) | status 1, +1000 USDC |
| `transfer(0x…dEaD, 5e18)` (stand-in Kolo top-up) | [`0xe0a9a6b7…06b4`](https://testnet.bscscan.com/tx/0xe0a9a6b78beb2701bcf4d4499b0ad76ffba16590a465b18d0989dd86b46f06b4) | status 1, balances 995 / 5 |

### What works live
- Backend (`tsx src/server.ts` on :3141, throwaway local Postgres, `BSC_RPC_URL=https://bsc-testnet-rpc.publicnode.com`): `POST /users` for a funded address → `201 {userId}`; an unfunded address → `202 awaiting_funding`; `GET /users/:id/balance` → `{"usdcBalance":"995",...}` read from the real MockUSDC.
- Frontend: `next build` with the testnet MockUSDC and publicnode RPC; `next start -p 3140` returned 200 on `/`, `/onboarding`, `/home`, `/pay`, `/history`, `/profile`, `/settings`, `/terms`. The MockUSDC address is inlined in the client bundle.
- All processes were stopped and the throwaway DB dropped.

### What's left
- BscScan source verification (needs an API key).
- Hosted Postgres + backend/frontend deploys (Railway/Vercel) with the env above.
- Kolo BEP-20 deposit confirmation (unchanged TODO).
- Browser-wallet (MetaMask) click-through.
