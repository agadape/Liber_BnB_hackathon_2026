# Ghost submission — form-ready copy

## Project name
liber:Ghost Protocol

## Tagline
A prefunded payment permission that can leave your phone.

## Tracks
Finance & Commerce; Consumer Apps.

## Contract address
0x0837ac35ec54F678ba08912dcfd6166a299FCA31

## Network
BNB Smart Chain **Testnet**, chain 97. Select Testnet, not Mainnet.

## Project logo
Upload `submission/liber-logo.png`, the original Liber logo.

## Problem statement
Digital checkout usually assumes the buyer has a charged, connected phone at the moment of payment. A dead battery or a deliberate screen-free outing can interrupt an ordinary purchase. Payment notifications report completed transfers; a different problem is giving a merchant a limited authorization prepared earlier, without handing over a wallet key. For prearranged merchants, can a buyer reserve funds and carry a permission restricted by recipient, amount, expiry and one-time use?

## Solution
Ghost turns a prefunded token authorization into a portable paper/QR voucher. The buyer prepares online, chooses a merchant, amount and expiry, signs an EIP-712 message, and reserves tokens in an immutable BNB vault. The merchant stays online and redeems with the named wallet before expiry. The contract releases the exact amount once and rejects replay or another merchant's claim. If unused, the owner can reclaim at or after expiry. Public receipts verify the contract event and matching token transfer. This release uses BSC Testnet and MockUSDC with no cash value.

## Project detail
Paste [submission/project-detail.md](submission/project-detail.md).

## GitHub repo
https://github.com/agadape/Liber_BnB_hackathon_2026

## Project website
https://liber-bnb-web.vercel.app/ghost

## Demo video
**Pending upload of the new Ghost film.** Insert its new YouTube URL after upload. The previous `WyFs-pF5AYM` video describes QRIS/invoices, not Ghost. [Upload copy](submission/YOUTUBE.md).

## Pitch deck — Canva/Drive
**Pending public Canva/Drive link.** Upload the generated Ghost PDF/PPTX, then paste its view link. The repository PDF is a supporting link; the supplied form explicitly requests Canva/Drive.

## Optional socials
Leave blank unless the owner supplies real project accounts. Personal/team fields are completed by the owner.

## Final publishing checklist
- [ ] New Ghost YouTube URL inserted here and in project-detail.md.
- [ ] Ghost deck public Canva/Drive view link inserted here.
- [ ] Owner completes personal fields and any required attestations.
- [ ] Network is BSC Testnet; address is the Ghost vault above.
- [ ] Preview confirms embeds and Mermaid render correctly.
