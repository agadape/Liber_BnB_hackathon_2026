# Ghost: two-device field test

## Goal and evidence boundary

Prove that a funded authorization can be redeemed **after the buyer phone is powered off**, using an online merchant device. This test uses a saved QR image instead of printed paper. It does not prove paper readability, merchant-offline payments, goods delivery, QRIS settlement or real-money operation.

Use BSC Testnet (chain 97), TEST BNB and MockUSDC only. Record the buyer shutdown and the merchant confirmation in one continuous shot if possible. An external camera is useful; a screen recording on the buyer phone stops at shutdown.

## Entry points

- [Buyer: issue](https://liber-bnb-web-git-codex-ghost-protocol-daves-projects-3628ad99.vercel.app/ghost/create)
- [Merchant: redeem](https://liber-bnb-web-git-codex-ghost-protocol-daves-projects-3628ad99.vercel.app/ghost/merchant)
- [Test funds](https://liber-bnb-web-git-codex-ghost-protocol-daves-projects-3628ad99.vercel.app/demo/funds)
- [Owner: recover/reclaim](https://liber-bnb-web-git-codex-ghost-protocol-daves-projects-3628ad99.vercel.app/ghost/vouchers)

The exact branch frontend and API domains are publicly accessible by the project owner's approval. Owner and merchant API writes/history still require SIWE. Other deployment URLs may require Vercel login. These links remain branch previews, not a production launch.

## 1. Prepare two different wallets

1. On the merchant device, open **Merchant: redeem**. Choose **Connect merchant wallet** for an injected wallet, or **Use device test wallet** for the browser's test wallet. Keep this browser/profile/device throughout the test.
2. Copy the full receiving wallet address displayed by the application. This is the exact recipient the buyer must use. Do not substitute a token/contract address.
3. On the buyer phone, open **Buyer: issue** and connect a different owner wallet. MetaMask must expose an unlocked account and be on BSC Testnet. A browser device test wallet is also supported.
4. On each device, open **Test funds** using the same browser/profile and wallet choice. Both wallets need TEST BNB; the buyer also needs MockUSDC. Use the linked testnet faucet if gas is missing, then claim MockUSDC through the app if needed. Claims themselves use TEST BNB gas.
5. Return to the Ghost pages. Recheck both displayed addresses. Do not clear browser data, change profiles, uninstall the wallet or lose the original owner key: Liber has no administrator recovery of wallet keys.

## 2. Issue one small voucher

1. Buyer pastes the merchant's displayed address, enters **1 MockUSDC** and selects **1 hour**. This gives enough time for handover and recording.
2. Click **Review authorization**. Check the full recipient, amount and printed expiry. These fields cannot change after signing.
3. Click **Sign & reserve**. For an injected wallet, review the limited EIP-712 signature, exact token approval if requested, and reservation transaction.
4. Wait for **Funds reserved. Your paper voucher is ready.** The QR must appear only after funding and 12 confirmations are checked.
5. Save the public reservation transaction link and voucher ID. These are safe evidence to share. The QR, its raw payload and authorization signature must stay private until handover.

## 3. Handover without a printer

1. Use **Save QR PNG**, then transfer the saved image directly to the intended merchant device. Keep the complete image and white border; do not crop into the QR, compress it heavily or upload it to a public site.
2. If saving is blocked by the browser, the merchant can photograph the buyer's displayed QR while the buyer is still online. Keep the full square and border in focus. This is an explicit image-handover fallback, not a verified download result.
3. On the merchant device, keep the image local. Do **not** redeem yet.
4. Start the evidence recording and **power the buyer phone off**. Closing a tab or switching apps is insufficient for a phone-off claim.
5. After shutdown, the online merchant uses **Or choose a QR image** to load the handed-over image. Liber decodes it locally; the authorization is not uploaded to the API.
6. Review the on-chain reservation, recipient, amount and expiry. The receiving account must match the voucher. Handing over the QR already authorizes this merchant to claim; buyer approval is not requested again.

## 4. Redeem and demonstrate replay rejection

1. Merchant clicks **Redeem once** and approves one transaction. Merchant pays TEST BNB gas.
2. Wait for **Payment confirmed** and the exact MockUSDC amount received, with at least 12 confirmations. A submitted/pending transaction or a successful QR scan is not payment evidence.
3. Open **Inspect transaction** and keep the public transaction hash. The contract event and exact ERC-20 transfer are independently checked by the app. Redemption makes the voucher signature public in transaction calldata by design.
4. Click **Scan another voucher** and load the **same image** again. Expected: **Already redeemed. No new transaction will be sent.** Do not create another voucher to demonstrate replay rejection.
5. Power the buyer phone back on. Its owner history should show the terminal state after refreshing. Optional API history sync is separate from the token transfer.

## 5. Expiry/reclaim on a separate voucher

1. Buyer issues a second **1 MockUSDC** voucher with **5 minutes + inclusion buffer**. Keep its reserve transaction link. Do not give its QR to the merchant.
2. Before expiry, owner reclaim must be unavailable. Wait until the displayed expiry has passed and refresh **Owner: recover/reclaim**.
3. Expected state: **expired reclaimable**. Click **Reclaim unused funds** once using the original owner wallet.
4. Wait for **Unused funds returned to the original owner. Exact token transfer verified.** Save the public reclaim hash.
5. If a transaction was submitted but confirmation timed out, use **Verify saved reclaim** / the saved transaction. Never automatically submit a replacement claim.

## Result to report

| Evidence | Record |
|---|---|
| Buyer phone off before merchant image load/redeem | Continuous footage or explicit manual observation |
| Reservation | Public transaction hash + voucher ID |
| Payment | Public redeem hash + exact amount + confirmed proof |
| Replay | Same image rejected; no additional transaction |
| Expired funds returned | Second voucher's reserve/reclaim hashes |
| Export | Actual PNG saved, or explicitly label photographed-image fallback |
| Wallet/device | Wallet app, browser and OS; no seed phrase/private key |

Share only public transaction hashes, voucher IDs and the result. Do not send an active QR, seed phrase, private key, wallet-session token or signature into chat or the repository.

## Still separate gates

- Print an active voucher on paper and scan it after the buyer phone is off.
- Verify the browser print dialog and actual saved PNG on the target devices.
- Test camera permissions and injected MetaMask on actual devices.
- Keep the PR draft until the release gates in `GHOST-IMPLEMENTATION.md` are satisfied. A public sandbox preview does not certify production readiness.
