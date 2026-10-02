import Link from "next/link";
import Image from "next/image";
import { DEMO_LINKS } from "@/lib/demo-links";

const tools = [
  { title: "Issue a voucher", detail: "One merchant. One amount.", href: "/ghost/create" },
  { title: "Redeem paper", detail: "Verify. Claim once.", href: "/ghost/merchant" },
  { title: "Your paper trail", detail: "Recover or reclaim.", href: "/ghost/vouchers" },
] as const;

export default function LandingPage() {
  return (
    <main id="main-content" className="landing-page">
      <div className="landing-container">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-intro">
            <p className="landing-eyebrow">liber:Ghost Protocol · built on BNB.</p>
            <h1 id="landing-title">A dead phone.<br />A live permission.</h1>
            <p className="landing-description">Reserve online. Carry paper. Your merchant claims once.</p>
            <Link href="/ghost" className="landing-primary">Meet Ghost <span aria-hidden="true">↗</span></Link>
          </div>
          <Image
            src="/illustrations/hero-success.jpg"
            alt="Illustrated Indonesian merchant holding a QR code outside her food stall"
            width={1000}
            height={1000}
            sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1200px) 46vw, 520px"
            loading="eager"
            fetchPriority="high"
            className="landing-hero-image"
          />
        </section>

        <section className="landing-tools" aria-label="Explore Liber">
          {tools.map(tool => (
            <Link href={tool.href} key={tool.href} className="landing-tool">
              <div><h2>{tool.title}</h2><p>{tool.detail}</p></div>
              <span aria-hidden="true">↗</span>
            </Link>
          ))}
        </section>

        <section className="landing-proof" aria-labelledby="proof-title">
          <Image
            src="/illustrations/problem-hook.jpg"
            alt="Illustration of a crypto user separated from a coffee shop by a wall"
            width={1000}
            height={1000}
            sizes="(max-width: 767px) 200px, 270px"
            className="landing-proof-image"
          />
          <div>
            <h2 id="proof-title">Buyer offline.<br />Merchant online.</h2>
            <p>A fixed recipient and amount.<br />Unused funds are reclaimable after expiry.</p>
            <Link href="/demo" className="landing-text-link">See the testnet proof <span aria-hidden="true">↗</span></Link>
          </div>
        </section>

        <footer className="landing-footer">
          <p>BSC Testnet only. MockUSDC has no cash value.</p>
          <div>
            <Link href="/demo/funds">Get demo tokens</Link>
            <a href="https://testnet.bscscan.com/address/0x0837ac35ec54F678ba08912dcfd6166a299FCA31" target="_blank" rel="noopener noreferrer">Ghost vault ↗</a>
            <a href={DEMO_LINKS.source} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
