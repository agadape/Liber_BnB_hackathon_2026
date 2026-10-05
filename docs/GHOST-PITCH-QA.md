# Ghost pitch and judge Q&A

## 30-second pitch
The sandwich is ready. Your phone is not. Ghost lets you prepare a payment permission earlier: choose one merchant, one amount and an expiry, sign it, and reserve tokens. Carry the authorization on paper; the online merchant claims once. An immutable BNB vault enforces the limits. Public testnet evidence shows a five-token payment, replay rejection and an unused two-token reclaim. Next: a small, prearranged merchant pilot.

## Does a QRIS soundbox solve this?
A soundbox announces a completed transfer. Ghost explores a portable authorization prepared before the buyer loses device access. They serve different needs. Ghost does not replace QRIS or its notification devices.

## Can any merchant cash the paper?
No. One merchant wallet is signed into the permission. This is also a trade-off: spontaneous purchases at unknown merchants are outside this release's design.

## What if someone photographs the QR?
Keep active QR data private. Another wallet cannot redeem, but the named merchant can claim a leaked valid permission before expiry. Ghost does not verify physical handover, goods delivery or consent at claim time. Public demo media uses a spent voucher only.

## Fully offline?
Buyer prepares online; merchant redeems online with gas. The design allows an absent/disconnected buyer at redemption. Whole-device-off physical testing is pending; the hosted browser exercise closed a voucher tab only.

## Lost paper?
The reservation remains. The owner can use a locally retained authorization or reclaim unused funds at/after expiry. No early cancellation. Losing the owner wallet key is not solved by paper recovery.

## Can the amount change or can it be claimed twice?
Signed fields bind the amount and recipient. A terminal redeemed/reclaimed state prevents replay. Tests and public execution reports demonstrate those constraints.

## Does the backend hold funds or signatures?
The immutable vault holds reserved tokens. The backend stores unsigned metadata and verified public proof records, with SIWE where appropriate. It does not retain active voucher signatures or wallet private keys. No admin withdrawal or upgrade path. Immutability also means a defect cannot be patched in place.

## Why BNB?
An EVM environment for ERC-20 reservations, EIP-712 checks and public events. BscScan makes testnet execution inspectable. We have not benchmarked fees or claimed a unique performance advantage.

## What does a receipt prove?
Canonical blocks, expected contract events and matching ERC-20 transfers with a 12-confirmation threshold. It does not prove delivery, exchange to IDR or absolute finality.

## Legal tender or licensed service?
This release uses test tokens with no cash value. It does not convert to rupiah, settle QRIS or claim regulatory approval. Real-value Indonesian deployment needs a defined operating model and qualified legal/regulatory review. Earlier QRIS sandbox is a separate experiment.

## Audited? Revenue? Traction?
No independent audit or validated revenue model. Unit, integration, fuzz/invariant and hosted checks exist. A bounded event with prearranged merchants and sandbox community tokens is our proposed wedge. Merchant willingness, preparation friction, expiry and scanning are hypotheses to measure.

## Why might this fail?
Preparation can be more cumbersome than ordinary payment. Preselecting merchants reduces flexibility; paper can be lost/leaked; merchants need connectivity and gas. Establish whether device-free use outweighs those costs before commercial/mainnet expansion.
