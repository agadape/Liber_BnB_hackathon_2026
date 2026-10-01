"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "../Logo";
import { useSessionStatus } from "@/lib/useSessionStatus";
import { IS_TESTNET } from "@/lib/chain";

const tabs = [
  { href: "/demo", label: "Demo" },
  { href: "/pilot", label: "QRIS sandbox" },
  { href: "/merchant", label: "BNB invoices" },
];
export function AppHeader() {
  const path = usePathname();
  const session = useSessionStatus();
  const active = (href: string) => path.startsWith(href) || (href === "/merchant" && (path === "/checkout" || path === "/receipt"));
  const links = tabs.map(tab => <Link key={tab.href} href={tab.href} aria-current={active(tab.href) ? "page" : undefined}>{tab.label}</Link>);
  return (
    <header className="landing-header">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="landing-container landing-header-inner">
        <Link href="/" aria-label="Liber home" className="landing-brand"><Logo className="h-8 w-8" /><span className="font-display text-2xl font-semibold italic">Liber<span className="text-gold-deep">.</span></span></Link>
        <nav aria-label="Main navigation" className="landing-nav">{links}</nav>
        <div className="landing-header-actions"><span className="landing-environment">{IS_TESTNET ? "Testnet" : "Prototype"}</span><Link href={session ? "/home" : "/onboarding"} className="landing-wallet" aria-current={["/home", "/onboarding", "/history", "/profile", "/settings", "/pay"].includes(path) ? "page" : undefined}>Wallet ↗</Link></div>
        <details key={path} className="landing-mobile-menu"><summary>Menu</summary><nav aria-label="Mobile navigation">{links}<Link href={session ? "/home" : "/onboarding"}>Wallet ↗</Link></nav></details>
      </div>
    </header>
  );
}
