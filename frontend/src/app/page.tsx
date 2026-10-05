import Link from "next/link";
import Image from "next/image";
import { GhostWalkthrough } from "@/components/ghost/GhostWalkthrough";
import { GhostEvidence } from "@/components/ghost/GhostEvidence";
import { GhostQuestions } from "@/components/ghost/GhostQuestions";
import { PROJECT_LINKS } from "@/lib/project-links";

const tools = [
  { title: "Issue a voucher", detail: "For the buyer. Set the limits.", href: "/ghost/create" },
  { title: "Redeem a voucher", detail: "For the merchant. Claim once.", href: "/ghost/merchant" },
  { title: "See your vouchers", detail: "For the owner. Keep the trail.", href: "/ghost/vouchers" },
] as const;

export default function LandingPage() {
  return <main id="main-content" className="landing-page liber-home"><div className="landing-container">
    <section className="landing-hero" aria-labelledby="landing-title"><div className="landing-intro"><p className="landing-eyebrow">liber:Ghost Protocol</p><h1 id="landing-title">A dead phone.<br />A live permission.</h1><p className="landing-description">Reserve online. Carry paper. Your merchant claims once.</p><div className="home-hero-actions"><Link href="/ghost" className="landing-primary">Ghost workspace <span aria-hidden="true">↗</span></Link><a href={PROJECT_LINKS.video} target="_blank" rel="noopener noreferrer" className="ghost-secondary-link">Watch demo <span aria-hidden="true">↗</span></a></div></div><Image src="/illustrations/hero-success.jpg" alt="Illustrated Indonesian merchant holding a QR code outside her food stall" width={1000} height={1000} sizes="(max-width:767px) calc(100vw - 40px), (max-width:1200px) 46vw, 520px" loading="eager" fetchPriority="high" className="landing-hero-image" /></section>
    <nav className="landing-tools" aria-label="Choose your Ghost workspace">{tools.map(tool => <Link href={tool.href} key={tool.href} className="landing-tool"><div><h2>{tool.title}</h2><p>{tool.detail}</p></div><span aria-hidden="true">↗</span></Link>)}</nav>
    <section className="home-story" aria-labelledby="story-title"><div className="home-story-art"><Image src="/illustrations/problem-hook.jpg" alt="Comic illustration of a buyer and a food stall on opposite sides of a wall" width={1000} height={1000} sizes="(max-width:767px) 280px,380px" /><p>Illustrative scenario. Testnet tokens only.</p></div><div className="home-story-copy"><h2 id="story-title">The sandwich is ready.<br /><em>Your battery is not.</em></h2><p>Ghost lets you prepare a permission before checkout. Keep it on paper, with the rules already attached.</p><dl className="home-rules"><div><dt>One merchant</dt><dd>You choose the receiving wallet.</dd></div><div><dt>One amount</dt><dd>The recipient cannot change it.</dd></div><div><dt>One claim</dt><dd>A copied code cannot pay twice.</dd></div></dl><p className="home-story-boundary">Buyer prepares online. Merchant redeems online.</p></div></section>
    <GhostWalkthrough /><GhostEvidence /><GhostQuestions />
  </div></main>;
}
