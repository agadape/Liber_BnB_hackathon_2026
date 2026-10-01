import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";
import { DEMO_LINKS } from "@/lib/demo-links";

const flows = [
  { number: "01", title: "QRIS sandbox", body: "Create a rupiah invoice. Confirm it with Midtrans. Timestamp its receipt hash on BNB.", href: "/pilot", action: "Open QRIS workspace", tag: "Midtrans + BNB" },
  { number: "02", title: "BNB invoices", body: "Fix the recipient, amount and expiry in a contract. Pay with MockUSDC and verify the transfer.", href: "/merchant", action: "Create a test invoice", tag: "BSC Testnet · chain 97" },
  { number: "03", title: "QR checks", body: "Inspect the merchant, amount and checksum before a payment. Try an intact or corrupted sample.", href: "/demo?view=checks", action: "Inspect a sample QR", tag: "No wallet needed" },
] as const;

export default function LandingPage() {
  return <PageShell wide>
    <section className="hero-grid relative overflow-hidden rounded-3xl bg-emerald-deep p-6 text-white sm:p-10">
      <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="fade-up">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Indonesia payments · BNB proof</p>
          <h1 className="mt-5 max-w-xl font-display text-5xl leading-[1.08] sm:text-6xl">A clear payment.<br/><span className="italic text-gold">A visible receipt.</span></h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">Liber connects a QRIS sandbox checkout to a public receipt hash on BNB Smart Chain. One place to create, check and verify.</p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link href="/demo" className="rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-95">Explore the demo →</Link>
            <Link href={DEMO_LINKS.sandboxReceipt} className="text-sm font-semibold text-white underline underline-offset-4">Open a completed receipt ↗</Link>
          </div>
          <p className="mt-4 text-xs text-white/55">Start without a wallet. Sandbox only; no real-money payments.</p>
        </div>
        <Link href={DEMO_LINKS.sandboxReceipt} aria-label="Inspect the completed Rp10,000 sandbox receipt" className="fade-up rounded-2xl border border-white/15 bg-white p-6 text-ink shadow-xl transition hover:-translate-y-1">
          <div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-widest text-ink/45">Completed test run</span><span className="rounded-full bg-emerald/10 px-3 py-1 text-xs font-semibold text-emerald">Confirmed ✓</span></div>
          <p className="mt-6 text-xs text-ink/50">QRIS sandbox invoice</p><p className="mt-1 text-4xl font-semibold tracking-tight">Rp10.000</p>
          <div className="mt-6 space-y-4 border-t border-ink/10 pt-5">
            {[ ["01", "Provider confirmation", "Midtrans reports sandbox settlement"], ["02", "Receipt commitment", "Receipt statement hashed for verification"], ["03", "BNB record", "Recorded on BSC Testnet · block 134186616"] ].map(([n,title,body])=><div key={n} className="flex items-start gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald/10 text-[10px] font-bold text-emerald">{n}</span><div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs text-ink/55">{body}</p></div></div>)}
          </div>
          <p className="mt-6 flex items-center justify-between border-t border-ink/10 pt-4 text-sm font-semibold text-emerald">Inspect receipt & BscScan proof <span>↗</span></p>
        </Link>
      </div>
    </section>
    <section className="mt-8" aria-labelledby="flows-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 id="flows-heading" className="text-lg font-semibold">Three flows. Clear evidence.</h2><span className="text-xs text-ink/50">Choose your starting point</span></div>
      <div className="grid gap-4 md:grid-cols-3">{flows.map(flow=><Link key={flow.number} href={flow.href} className="group flex flex-col rounded-2xl border border-ink/10 bg-white p-5 transition hover:border-emerald/40 hover:shadow-md"><div className="flex items-center justify-between"><span className="font-mono text-xs text-ink/40">{flow.number}</span><span className="rounded-full bg-paper px-2.5 py-1 text-[10px] font-semibold text-ink/60">{flow.tag}</span></div><h3 className="mt-5 text-xl font-semibold">{flow.title}</h3><p className="mt-2 flex-1 text-sm leading-relaxed text-ink/60">{flow.body}</p><p className="mt-5 text-sm font-semibold text-emerald">{flow.action} <span className="inline-block transition group-hover:translate-x-1">→</span></p></Link>)}</div>
    </section>
    <footer className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-5 text-xs text-ink/55"><p>Provider confirms rupiah status. BNB records the receipt hash.</p><div className="flex gap-4"><a href={DEMO_LINKS.registry} target="_blank" rel="noopener noreferrer" className="text-emerald underline">BNB contract ↗</a><a href={DEMO_LINKS.source} target="_blank" rel="noopener noreferrer" className="text-emerald underline">Source ↗</a></div></footer>
  </PageShell>;
}
