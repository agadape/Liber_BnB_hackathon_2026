# contracts/ — BSC testnet MockUSDC

Liber has no custom on-chain logic: wallets are plain EVM keypairs and a Kolo top-up is a standard
ERC-20 `transfer` of USDC on BNB Smart Chain. On **BSC mainnet (56)** the app uses Binance-Peg USDC
(`0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d`, 18 decimals), so nothing needs deploying.

For **BSC testnet (97)** there is no canonical USDC, so this Foundry project ships `MockUSDC`
(18 decimals, open `faucet()`/`mint()` — testnet only).

```bash
cd contracts
forge install --no-git OpenZeppelin/openzeppelin-contracts@v5.1.0 foundry-rs/forge-std
forge build
cp .env.example .env   # fill DEPLOYER_PRIVATE_KEY (funded from https://www.bnbchain.org/en/testnet-faucet)
source .env
forge script script/DeployMockUSDC.s.sol --rpc-url bsc_testnet --broadcast --private-key $DEPLOYER_PRIVATE_KEY
```

Put the printed address in `backend/.env` (`USDC_ADDRESS`) and `frontend/.env.local` (`NEXT_PUBLIC_USDC_ADDRESS`).
