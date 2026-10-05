import Link from "next/link";
import { GHOST_DEMO } from "@/lib/ghost/evidence";
import { PROJECT_LINKS } from "@/lib/project-links";

export function GhostEvidence() {
  return <section className="liber-evidence" aria-labelledby="evidence-title">
    <div className="liber-section-title"><h2 id="evidence-title">Follow the tokens.</h2><p>Two separate recorded testnet runs. Public receipts, no wallet login.</p></div>
    <div className="evidence-grid">
      <Link href={`/ghost/receipt?id=${GHOST_DEMO.paymentId}`} className="evidence-receipt"><div className="evidence-receipt-top"><span>Merchant payment</span><span>Recorded 2 Oct 2026</span></div><p className="evidence-value">5 <span>MockUSDC</span></p><div className="evidence-receipt-bottom"><div><strong>Claimed once</strong><p>Exact transfer to the named merchant.</p></div><span className="evidence-arrow" aria-hidden="true">↗</span></div></Link>
      <Link href={`/ghost/receipt?id=${GHOST_DEMO.reclaimId}`} className="evidence-receipt evidence-receipt--return"><div className="evidence-receipt-top"><span>Owner recovery</span><span>Separate voucher</span></div><p className="evidence-value">2 <span>MockUSDC</span></p><div className="evidence-receipt-bottom"><div><strong>Returned after expiry</strong><p>Unused funds reclaimed by the owner.</p></div><span className="evidence-arrow" aria-hidden="true">↗</span></div></Link>
    </div>
    <div className="evidence-resources"><p>Test tokens have no cash value. A transfer does not verify goods delivery.</p><div><a href={PROJECT_LINKS.video} target="_blank" rel="noopener noreferrer">Watch the 2-minute film <span aria-hidden="true">↗</span></a><a href={PROJECT_LINKS.deck} target="_blank" rel="noopener noreferrer">Read the pitch <span aria-hidden="true">↗</span></a></div></div>
  </section>;
}
