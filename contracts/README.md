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

## LiberReceiptRegistry

`record(commitment)` timestamps a nonzero receipt hash on chain 97. Each hash can be recorded once, by any wallet, with no owner, upgrade or fund custody. The canonical statement binds environment, invoice amount, status and observation time inside the hash. The public event identifies the recorder; it does not certify that recorder as the merchant.

The API accepts a chain proof only for an existing provider-confirmed statement and a successful transaction to the configured registry with the matching event. Midtrans remains the source of fiat status. See [PILOT.md](../PILOT.md) for account setup and current limitations. Compiler input is in `verification/LiberReceiptRegistry.standard-input.json`.

Live registry: [0xf1267a5ab17b61c5c110b95d4dbb6197ffbbb46d — verified source on BscScan](https://testnet.bscscan.com/address/0xf1267a5ab17b61c5c110b95d4dbb6197ffbbb46d#code), also an [exact Sourcify match](https://repo.sourcify.dev/97/0xF1267a5AB17b61C5c110B95d4dbb6197ffBbB46D).

To deploy this testnet-only registry yourself: `forge script script/DeployLiberReceiptRegistry.s.sol --rpc-url bsc_testnet --broadcast`. Its script reads the ignored deployment environment key. Set its address as `RECEIPT_REGISTRY_ADDRESS` on the API, never a private key.
