# Liber contracts — BSC Testnet

**LiberInvoice** is the project's native merchant invoice contract. **MockUSDC** is its test token
(18 decimals, open `faucet()`/`mint()`, no monetary value). Both target chain 97.

- `createInvoice(nonce, amount, expiresAt)`: merchant fixes amount and expiry, up to seven days.
- `payInvoice(id)`: buyer approves the exact amount first. Tokens move directly to the merchant.
- `cancelInvoice(id)`: merchant can cancel an unpaid invoice.
- The contract rejects expired, cancelled, unknown and already-paid invoices, merchant self-payment,
  and tokens that deliver less than the invoice amount. It has no owner, upgrades or service fee.

Live address: [LiberInvoice](https://testnet.bscscan.com/address/0x2ad1785460b3c60b0131b0649b37dacf3dc17b1c).
Source has an [exact Sourcify match](https://repo.sourcify.dev/97/0x2Ad1785460b3C60b0131b0649B37dACF3DC17b1C).
BscScan source publication is pending its upstream daily submission limit.

```bash
cd contracts
forge install --no-git OpenZeppelin/openzeppelin-contracts@v5.1.0 foundry-rs/forge-std
forge build
forge test
cp .env.example .env   # fill DEPLOYER_PRIVATE_KEY (funded from https://www.bnbchain.org/en/testnet-faucet)
source .env
forge script script/DeployMockUSDC.s.sol --rpc-url bsc_testnet --broadcast --private-key $DEPLOYER_PRIVATE_KEY
```

Put the printed address in `backend/.env` (`USDC_ADDRESS`) and `frontend/.env.local` (`NEXT_PUBLIC_USDC_ADDRESS`).

To deploy LiberInvoice against that test token, set `USDC_ADDRESS` in the deployment environment and run:

```bash
forge script script/DeployLiberInvoice.s.sol --rpc-url bsc_testnet --broadcast
```

The script reads `DEPLOYER_PRIVATE_KEY` from the environment. Keep it in ignored local storage;
never commit it. Set the resulting address as `INVOICE_CONTRACT_ADDRESS` on the backend.
The constructor refuses chains other than BSC Testnet.

Deployment and sample payment records are in `deployments/`. Reproducible Solidity compiler input,
including imported source files, is in `verification/LiberInvoice.standard-input.json`.
Public receipt verification requires both the invoice payment event and the matching token transfer.
QRIS settlement, Kolo card credit and goods delivery are outside this contract.
