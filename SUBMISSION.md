# Liber — submission notes

## Project description

Liber helps Indonesian crypto users read a merchant QR, understand what has actually been checked, and review a separate native BNB invoice before signing. Its BSC Testnet contract transfers an exact token amount directly to the recipient, and its public receipt verifies both the invoice event and token movement. Optional AI explains validated, redacted facts in Indonesian; it never controls payments.

The next step is a one-merchant QRIS pilot: buyers pay rupiah through Midtrans, while BNB timestamps a hash of the provider-confirmed receipt. Merchant authentication, idempotent order creation, independent provider checks and refund history are implemented. The merchant account is not connected yet; real payments and provider account E2E validation remain pending.

## Submission links

- Tracks: Finance & Commerce; Consumer Apps.
- Public source: https://github.com/agadape/Liber_BnB_hackathon_2026
- Live demo: https://liber-bnb-web.vercel.app/demo
- QRIS pilot and connection status: https://liber-bnb-web.vercel.app/pilot (setup: [PILOT.md](PILOT.md)).
- Project contract: https://testnet.bscscan.com/address/0x2ad1785460b3c60b0131b0649b37dacf3dc17b1c
- Exact source match: https://repo.sourcify.dev/97/0x2Ad1785460b3C60b0131b0649B37dACF3DC17b1C
- Confirmed BNB payment proof: https://liber-bnb-web.vercel.app/receipt?id=0x9472aacf99e2369eaf65a51d2e7b0f515c6433ac32d0450da1b18e9465ded034
- User-selected video: https://youtu.be/tAt_Gn67OII (earlier Stellar demo; label it accurately).

Team/member/contact details are completed by the team in the submission portal.

## Two-minute judge walkthrough

1. **0:00–0:30** Open /demo. Click the valid Rp25,000 synthetic QR. Show format/checksum results and the explicit merchant identity and settlement limits. If AI is unavailable, identify the explanation as checks-only.
2. **0:30–0:45** Click corrupted sample. Show rejection instead of a quote or payment prompt.
3. **0:45–1:15** Open Merchant Mode. With a funded test wallet, create a 5 MockUSDC invoice. Share its QR/link with a different buyer wallet. This QR is a Liber checkout link, not a QRIS settlement request.
4. **1:15–1:45** Buyer reviews recipient, amount, expiry and BSC Testnet. Approve the exact amount, then sign payment separately. The recipient receives test tokens directly.
5. **1:45–2:00** Open public payment proof. Show verified receipt and both events, then the BscScan transaction. The built-in confirmed receipt works without a wallet if a live walkthrough takes longer.

Wallet transactions require TEST BNB gas; get it from https://www.bnbchain.org/en/testnet-faucet. MockUSDC is available from the test-token faucet inside checkout.

## Claims to keep precise

- This is a BSC Testnet prototype using tokens with no monetary value.
- QR format/CRC checks do not authenticate merchants.
- Native test-token invoices are separate from the Midtrans rupiah pilot. A registry hash is a timestamped statement, not independent proof of fiat settlement. Kolo credit and goods delivery are not verified.
- Midtrans account onboarding, sandbox E2E and production activation are still pending. Do not present fixture-based tests as real QRIS payments.
- Source is exactly verified on Sourcify; BscScan publication is currently pending its upstream daily submission limit.
- AI code is implemented and tested. Live model activation awaits the user's Vercel free-credit verification; the demo honestly falls back to checked facts.
- No promise of hackathon ranking, independent security audit or production readiness.
