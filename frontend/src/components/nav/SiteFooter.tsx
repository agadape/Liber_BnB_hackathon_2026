import Link from "next/link";
import { Logo } from "../Logo";
import { PROJECT_LINKS } from "@/lib/project-links";

export function SiteFooter() {
  return <footer className="site-footer ghost-no-print"><div className="landing-container"><div className="site-footer-top"><Link href="/" className="landing-brand" aria-label="Liber home"><Logo className="h-8 w-8" /><span className="font-display text-3xl italic">liber:</span></Link><p>A little less screen.<br />A little more life.</p><nav aria-label="Footer navigation"><Link href="/ghost">Ghost workspace</Link><Link href="/demo">Demo</Link><a href={PROJECT_LINKS.source} target="_blank" rel="noopener noreferrer">GitHub ↗</a><Link href="/terms">Terms</Link></nav></div><div className="site-footer-bottom"><p>Built on BNB Smart Chain Testnet. MockUSDC has no cash value.</p><a href={PROJECT_LINKS.submission} target="_blank" rel="noopener noreferrer">Indonesia Web3 Hackathon 2026 ↗</a></div></div></footer>;
}
