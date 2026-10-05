# Ghost in two minutes — no wallet needed

## 0:00 — The idea
Open [Ghost](https://liber-bnb-web.vercel.app/ghost). The buyer prepares online and reserves funds. A named merchant later claims a paper authorization once. Merchant connectivity remains required.

## 0:25 — Inspect a payment
Open the [5 MockUSDC receipt](https://liber-bnb-web.vercel.app/ghost/receipt?id=0xdfad2e816fba512fdda912ced241d9464c3f1358c16427fcfd7ac3fac2067924). Wait for **Verified token payment**, not “proof pending”. Inspect the linked reserve and redemption transactions. Merchant: `0x9B00334f8fb61F57071a2AaEB4E76E4a5726f37B`.

## 0:55 — Inspect recovery
Open the [2 MockUSDC receipt](https://liber-bnb-web.vercel.app/ghost/receipt?id=0x5f04a6af2b67a0519ed123946b3b5834d5648974ea23edfd8c70fbf2c0a567fb). Wait for **Verified reclaim**. This is a separate voucher. Its owner explicitly reclaimed unused funds after expiry.

## 1:20 — Inspect enforcement
Review [exact source](https://repo.sourcify.dev/97/0x0837ac35ec54F678ba08912dcfd6166a299FCA31) and the [on-chain report](../contracts/deployments/ghost-demo-e2e.json): named merchant, replay rejection and early-reclaim rejection. The [hosted UI report](../contracts/deployments/ghost-ui-e2e.json) separately records redemption and rescan rejection without a new transaction.

## 1:45 — Understand the boundary
BSC Testnet, chain 97. MockUSDC has no cash value. Complete physical buyer-device-off and printed-paper tests remain pending. The browser exercise closed a voucher tab, not the device. Token transfer does not prove goods delivery or rupiah settlement.

## If a page is slow
Use **Refresh verification** once, or inspect its linked BscScan transactions. Loading is not a verified receipt. No wallet, funds or signature is needed for this guide.

Recorded UI release: `c7bc856307921b04ec6c504a2273abd0a7d44152`; [main CI 37007328822](https://github.com/agadape/Liber_BnB_hackathon_2026/actions/runs/37007328822). Submission assets may have a later commit without changing this recorded release.
