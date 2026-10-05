import Link from "next/link";
import Image from "next/image";
import { GhostShell } from "@/components/ghost/GhostShell";
import { GhostWalkthrough } from "@/components/ghost/GhostWalkthrough";
import { GhostEvidence } from "@/components/ghost/GhostEvidence";
import { GhostQuestions } from "@/components/ghost/GhostQuestions";

export default function GhostPage() {
  return <GhostShell title="Phone off. Permission on." landing>
    <section className="ghost-hero" aria-labelledby="ghost-title"><div className="ghost-hero-copy"><p className="ghost-kicker">Less screen. More life.</p><h1 id="ghost-title">Phone off.<br /><em>Permission on.</em></h1><p className="ghost-hero-description">Reserve tokens online. Carry a limited payment permission on paper. Your merchant claims once.</p><div className="ghost-hero-actions"><Link className="ghost-primary-link" href="/ghost/create">Issue a voucher <span aria-hidden="true">↗</span></Link><Link className="ghost-secondary-link" href="/ghost/merchant">Redeem a voucher <span aria-hidden="true">↗</span></Link></div></div><div className="ghost-hero-visual"><Image src="/illustrations/hero-success.jpg" width={1000} height={1000} alt="Illustrated Indonesian merchant holding a printed code outside her stall" sizes="(max-width:767px) calc(100vw - 40px),480px" loading="eager" fetchPriority="high" className="ghost-hero-art" /><div className="ghost-art-caption"><span>Buyer offline.<br /><strong>Merchant online.</strong></span><span className="ghost-stamp">ONE<br />CLAIM ↗</span></div></div></section>
    <section className="ghost-workbench" aria-labelledby="workbench-title"><div className="workbench-intro"><h2 id="workbench-title">Pick up<br /><em>your paper trail.</em></h2><p>BSC Testnet. MockUSDC has no cash value.</p></div><div className="workbench-links"><Link href="/ghost/vouchers"><div><strong>See your vouchers</strong><p>Recover a reservation or reclaim after expiry.</p></div><span aria-hidden="true">↗</span></Link><Link href="/demo/funds"><div><strong>Get test tokens</strong><p>TEST BNB for gas. MockUSDC for vouchers.</p></div><span aria-hidden="true">↗</span></Link></div></section>
    <GhostWalkthrough /><GhostEvidence /><GhostQuestions />
  </GhostShell>;
}
