import Link from "next/link";
import Image from "next/image";
import { PageShell } from "@/components/ui/PageShell";
import { DEMO_LINKS } from "@/lib/demo-links";

const flows = [
  { number: "01", title: "QRIS sandbox", body: "Create a rupiah test invoice through Midtrans. Record its confirmed receipt hash on BNB.", href: "/pilot", action: "Open QRIS workspace" },
  { number: "02", title: "BNB invoices", body: "Set the recipient, amount and expiry. Pay with MockUSDC and verify the transfer on chain.", href: "/merchant", action: "Create a test invoice" },
  { number: "03", title: "QR checks", body: "Read the merchant, amount and checksum. Compare intact and corrupted QR samples.", href: "/demo?view=checks", action: "Inspect a sample QR" },
] as const;

export default function LandingPage() {
  return <PageShell wide>
    <section className="grid items-center gap-9 py-3 lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:py-6">
      <div className="fade-up text-center lg:text-left">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald">Made for Indonesia · Built on BNB</p>
        <h1 className="mt-4 font-display text-4xl leading-[1.1] sm:text-6xl">Scan. Understand.<br/><span className="italic text-emerald">Verify on BNB.</span></h1>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-ink/65 sm:text-base lg:mx-0">A familiar QR. A clear amount. A receipt you can inspect. Explore QRIS sandbox payments and merchant invoices on BNB Smart Chain.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
          <Link href="/demo" className="action-link bg-gold text-ink shadow-sm">Try the two-minute demo →</Link>
          <Link href="/demo/funds" className="action-link border border-emerald/20 text-emerald">Get demo tokens ↗</Link>
        </div>
        <p className="mt-4 text-xs text-ink/50">Start without a wallet · Sandbox only · No real-money payments</p>
      </div>
      <div className="fade-up mx-auto w-full max-w-[340px] overflow-hidden rounded-[26px] border-[3px] border-ink bg-paper shadow-[7px_7px_0_#101e1a] sm:max-w-[390px]">
        <Image src="/illustrations/hero-success.jpg" alt="Illustrated Indonesian merchant holding a QR code outside her food stall" width={1000} height={1000} sizes="(max-width: 640px) 85vw, 390px" loading="eager" fetchPriority="high" className="h-auto w-full"/>
      </div>
    </section>
    <section className="mt-10 grid items-center gap-5 rounded-2xl border border-ink/10 bg-white/70 p-5 sm:grid-cols-[140px_1fr] sm:gap-7 sm:p-6">
      <div className="mx-auto w-28 overflow-hidden rounded-xl border-2 border-ink sm:w-36"><Image src="/illustrations/problem-hook.jpg" alt="Illustration of a crypto user separated from a coffee shop by a wall" width={1000} height={1000} sizes="144px" className="h-auto w-full"/></div>
      <div className="text-center sm:text-left"><h2 className="font-display text-2xl italic sm:text-3xl">Bring clarity to the checkout.</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60">Amounts, recipients and payment evidence belong in one clear flow. Midtrans confirms the QRIS sandbox status; BNB timestamps the receipt hash. Native token invoices have their own verifiable transfer receipt.</p><Link href={DEMO_LINKS.sandboxReceipt} className="mt-3 inline-block text-sm font-semibold text-emerald underline underline-offset-4">Inspect the completed Rp10.000 sandbox run ↗</Link></div>
    </section>
    <section className="mt-8" aria-labelledby="flows-heading">
      <h2 id="flows-heading" className="mb-4 text-lg font-semibold">Choose your demo</h2>
      <div className="grid gap-4 md:grid-cols-3">{flows.map(flow=><Link key={flow.number} href={flow.href} className="group flex flex-col rounded-2xl border border-ink/10 bg-white p-5 transition hover:border-emerald/40 hover:shadow-md"><span className="font-mono text-xs text-ink/40">{flow.number}</span><h3 className="mt-3 text-lg font-semibold">{flow.title}</h3><p className="mt-2 flex-1 text-sm leading-relaxed text-ink/60">{flow.body}</p><p className="mt-4 text-sm font-semibold text-emerald">{flow.action} →</p></Link>)}</div>
    </section>
    <footer className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-5 text-xs text-ink/55"><p>Test funds. Real transactions on BSC Testnet.</p><div className="flex gap-4"><a href={DEMO_LINKS.registry} target="_blank" rel="noopener noreferrer" className="text-emerald underline">BNB contract ↗</a><a href={DEMO_LINKS.source} target="_blank" rel="noopener noreferrer" className="text-emerald underline">Source ↗</a></div></footer>
  </PageShell>;
}
