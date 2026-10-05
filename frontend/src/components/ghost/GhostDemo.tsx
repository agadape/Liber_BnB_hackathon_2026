import Link from "next/link";
import Image from "next/image";
import { GHOST_DEMO } from "@/lib/ghost/evidence";
import { PROJECT_LINKS } from "@/lib/project-links";
export function GhostDemo() {
  return <section className="demo-stage">
    <div>
      <p className="demo-amount">5 MockUSDC<small>Confirmed Ghost testnet run · 2 Oct 2026</small></p>
      <h2 className="mt-7 font-display text-3xl">The buyer left. The permission stayed.</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/65">Reserve first. Hand over paper. The merchant claims once, with their own wallet.</p>
      <div className="demo-links"><Link className="action-link bg-emerald-deep text-paper" href={`/ghost/receipt?id=${GHOST_DEMO.paymentId}`}>View payment receipt ↗</Link><Link href="/ghost/create">Issue your own voucher ↗</Link></div>
      <nav className="demo-resources" aria-label="Ghost presentation"><a href={PROJECT_LINKS.video} target="_blank" rel="noopener noreferrer">Watch the film ↗</a><a href={PROJECT_LINKS.deck} target="_blank" rel="noopener noreferrer">Read the pitch ↗</a><Link href={`/ghost/receipt?id=${GHOST_DEMO.reclaimId}`}>See the 2-token return ↗</Link></nav>
      <p className="mt-5 max-w-md text-xs leading-relaxed text-ink/65">This run used separate buyer and merchant processes. Physical phone-off footage is pending. Merchant internet and TEST BNB are required.</p>
      <details className="flow-explanation"><summary>The three things we proved</summary><ol><li><h3 className="font-semibold">Exact claim</h3><p>The merchant received exactly 5 test tokens. No buyer key was read during redemption.</p></li><li><h3 className="font-semibold">One use</h3><p>A different wallet and a repeat claim were rejected.</p></li><li><h3 className="font-semibold">Expired return</h3><p>A second unused voucher returned 2 tokens to its owner after expiry.</p><a className="landing-text-link" href={`https://testnet.bscscan.com/tx/${GHOST_DEMO.reclaimTx}`} target="_blank" rel="noopener noreferrer">Inspect reclaim ↗</a></li></ol></details>
      <p className="mt-5 max-w-md text-xs text-ink/65">MockUSDC has no cash value. Handing over the QR authorizes an immediate merchant claim; delivery is not guaranteed.</p>
    </div>
    <Image src="/illustrations/hero-success.jpg" alt="Liber's illustrated merchant holding a printed code" width={1000} height={1000} sizes="(max-width:1023px) 280px,360px" loading="eager" className="demo-art" />
  </section>;
}
