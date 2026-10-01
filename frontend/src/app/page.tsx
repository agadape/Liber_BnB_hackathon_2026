import Link from "next/link";
import Image from "next/image";
import { DEMO_LINKS } from "@/lib/demo-links";

const tools = [
  { title: "QRIS sandbox", detail: "Rupiah test payments", href: "/pilot" },
  { title: "BNB invoices", detail: "Payments in test tokens", href: "/merchant" },
  { title: "QR checks", detail: "Know what you scan", href: "/demo?view=checks" },
] as const;

export default function LandingPage() {
  return (
    <main id="main-content" className="landing-page">
      <div className="landing-container">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-intro">
            <p className="landing-eyebrow">Everyday payments, built on BNB.</p>
            <h1 id="landing-title">A familiar QR.<br />A clearer checkout.</h1>
            <p className="landing-description">QRIS sandbox payments and BNB invoices, with receipts you can verify.</p>
            <Link href="/demo" className="landing-primary">Try Liber <span aria-hidden="true">↗</span></Link>
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
            <h2 id="proof-title">Less guesswork.<br />More proof.</h2>
            <p>A completed Rp10.000 sandbox payment.<br />Its receipt hash, recorded on BNB.</p>
            <Link href={DEMO_LINKS.sandboxReceipt} className="landing-text-link">See the receipt <span aria-hidden="true">↗</span></Link>
          </div>
        </section>

        <footer className="landing-footer">
          <p>Sandbox only. No real-money payments.</p>
          <div>
            <Link href="/demo/funds">Get demo tokens</Link>
            <a href={DEMO_LINKS.registry} target="_blank" rel="noopener noreferrer">BNB contract ↗</a>
            <a href={DEMO_LINKS.source} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
