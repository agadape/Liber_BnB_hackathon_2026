# Liber — submission notes

## Project description

Liber helps Indonesian crypto users read a merchant QR, understand what has actually been checked, and review a separate native BNB invoice before signing. Its BSC Testnet contract transfers an exact token amount directly to the recipient, and its public receipt verifies both the invoice event and token movement. Optional AI explains validated, redacted facts in Indonesian; it never controls payments.

The one-merchant QRIS pilot adds rupiah invoices through Midtrans, while BNB timestamps a hash of the provider-confirmed receipt. Merchant authentication, idempotent order creation, independent provider checks and refund history are implemented. A Rp10,000 connected-account sandbox payment and BSC Testnet receipt recording have passed end to end. Real payments remain disabled pending production onboarding.

## Submission links

- Tracks: Finance & Commerce; Consumer Apps.
- Public source: https://github.com/agadape/Liber_BnB_hackathon_2026
- Live demo: https://liber-bnb-web.vercel.app/demo
- QRIS pilot and connection status: https://liber-bnb-web.vercel.app/pilot (setup: [PILOT.md](PILOT.md)).
- Confirmed Rp10,000 QRIS sandbox receipt: https://liber-bnb-web.vercel.app/pilot/receipt?id=5e28547c-4936-4fdf-970b-198fc623fcf4
- BNB recording of that sandbox receipt: https://testnet.bscscan.com/tx/0x12b0809769aac39b4274d08f9c0b37f1308048b5f4811232276cb7a2a55dcc83
- Project contract: https://testnet.bscscan.com/address/0x2ad1785460b3c60b0131b0649b37dacf3dc17b1c
- Pilot receipt registry, BscScan verified source: https://testnet.bscscan.com/address/0xf1267a5ab17b61c5c110b95d4dbb6197ffbbb46d#code
- Exact source match: https://repo.sourcify.dev/97/0x2Ad1785460b3C60b0131b0649B37dACF3DC17b1C
- Confirmed BNB payment proof: https://liber-bnb-web.vercel.app/receipt?id=0x9472aacf99e2369eaf65a51d2e7b0f515c6433ac32d0450da1b18e9465ded034
- User-selected video: https://youtu.be/tAt_Gn67OII (earlier Stellar demo; label it accurately).

Team/member/contact details are completed by the team in the submission portal.

## Two-minute judge walkthrough

1. **0:00–0:20** Open `/`. Show the three available flows and the completed Rp10,000 sandbox run. Open the demo; no wallet is required.
2. **0:20–0:55** In **QRIS sandbox**, open the completed receipt. Show its explicit sandbox label, provider-confirmed status, receipt statement and BscScan recording. Midtrans confirms the payment status; BNB timestamps its hash.
3. **0:55–1:20** Switch to **BNB invoice**. Open the completed 5 MockUSDC receipt. Show the verified invoice event and exact token transfer. This is a separate test-token payment flow.
4. **1:20–1:45** Switch to **QR checks**. Try the valid Rp25,000 synthetic QR, then the corrupted sample. Show the checked facts and rejection. If AI is unavailable, describe the explanation as checks-only.
5. **1:45–2:00** Open the QRIS workspace or BNB invoices. Show wallet-based merchant access and invoice creation controls. Connect funded test wallets for a longer live creation/payment walkthrough.

The submission uses **Midtrans Sandbox + BSC Testnet** throughout. Production onboarding is deferred; do not describe simulated payments as real-money settlement.

Wallet transactions require TEST BNB gas; get it from https://www.bnbchain.org/en/testnet-faucet. MockUSDC is available from the test-token faucet inside checkout.

For the QRIS pilot extension, open the confirmed sandbox receipt above. Show its Rp10,000 IDR amount, explicit sandbox environment, provider-confirmed status, downloadable receipt statement and matching BSC Testnet recording. Buyers need no crypto wallet for QRIS checkout. This is evidence of a real provider integration exercised with simulated funds; do not describe it as a real-money payment.

## Claims to keep precise

- This is a BSC Testnet prototype using tokens with no monetary value.
- QR format/CRC checks do not authenticate merchants.
- Native test-token invoices are separate from the Midtrans rupiah pilot. A registry hash is a timestamped statement, not independent proof of fiat settlement. Kolo credit and goods delivery are not verified.
- Connected-account sandbox E2E passed for one Rp10,000 payment and its verified BNB receipt hash. Production business onboarding, real payment, bank disbursement and live refund/expiry checks remain pending.
- LiberInvoice is exactly verified on Sourcify; its BscScan publication is pending. LiberReceiptRegistry source is verified with an exact match on both BscScan and Sourcify.
- AI code is implemented and tested. Live model activation awaits the user's Vercel free-credit verification; the demo honestly falls back to checked facts.
- No promise of hackathon ranking, independent security audit or production readiness.
