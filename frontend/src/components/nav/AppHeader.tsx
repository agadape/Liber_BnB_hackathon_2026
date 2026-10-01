"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {Logo} from "../Logo";
import {useSessionStatus} from "@/lib/useSessionStatus";
const tabs=[{href:"/demo",label:"Demo"},{href:"/pilot",label:"QRIS sandbox"},{href:"/merchant",label:"BNB invoices"}];
export function AppHeader(){
  const path=usePathname(),session=useSessionStatus();
  const active=(href:string)=>path.startsWith(href)||(href==="/merchant"&&(path==="/checkout"||path==="/receipt"));
  return <header className="relative z-20 border-b border-ink/10 bg-paper/95">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-4 sm:px-8">
      <Link href="/" aria-label="Liber home" className="flex items-center gap-2.5"><Logo className="h-8 w-8"/><span className="font-display text-2xl font-semibold italic">Liber<span className="text-gold-deep">.</span></span></Link>
      <nav aria-label="Main navigation" className="order-3 flex w-full items-center gap-1 rounded-xl bg-ink/5 p-1 sm:order-none sm:w-auto">
        {tabs.map(tab=><Link key={tab.href} href={tab.href} aria-current={active(tab.href)?"page":undefined} className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-semibold transition sm:flex-none sm:px-4 ${active(tab.href)?"bg-white text-ink shadow-sm":"text-ink/65 hover:bg-white/60 hover:text-ink"}`}>{tab.label}</Link>)}
      </nav>
      <Link href={session?"/home":"/onboarding"} className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold hover:border-emerald/40">Wallet ↗</Link>
    </div>
  </header>;
}
