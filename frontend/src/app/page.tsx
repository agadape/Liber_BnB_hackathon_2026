"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/Logo";
import { ScanIcon, ProfileIcon, HistoryIcon } from "@/components/icons";
import { useSessionStatus } from "@/lib/useSessionStatus";

const STEPS = [
  {
    Icon: ScanIcon,
    title: "Scan and understand",
    body: "Check an IDR merchant QR, inspect its checksum, and get a plain-language explanation with Payment Copilot.",
  },
  {
    Icon: ProfileIcon,
    title: "Create a Liber invoice",
    body: "A merchant fixes the recipient, token amount and expiry on BNB. Share a separate Liber invoice QR with the buyer.",
  },
  {
    Icon: HistoryIcon,
    title: "Pay and verify",
    body: "Approve the exact amount, sign a test payment, and verify both the invoice event and token transfer on BscScan.",
  },
] as const;

const TRUST = ["Device-held keys", "BNB invoice contract", "Public payment proofs"] as const;

export default function LandingPage() {
  const router = useRouter();
  const session = useSessionStatus();

  useEffect(() => {
    if (session === true) {
      router.replace("/home");
    }
  }, [router, session]);

  if (session !== false) return null;

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-paper text-ink">
      <div className="liber-mesh" />

      <div className="relative mx-auto flex max-w-5xl flex-col px-6 py-8 md:px-12 md:py-12">
        <header className="fade-up flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="font-display text-lg italic text-emerald">Liber</span>
        </header>

        <section className="mt-12 flex flex-col items-center gap-10 md:mt-20 md:flex-row md:items-center md:gap-16">
          <div className="max-w-xl text-center md:text-left">
            <h1 className="fade-up font-display text-4xl leading-tight text-ink md:text-6xl" style={{ animationDelay: "80ms" }}>
              Scan. Understand. <span className="italic text-emerald">Verify on BNB.</span>
            </h1>
            <p className="fade-up mt-5 text-base text-ink/60 md:text-lg" style={{ animationDelay: "160ms" }}>
              A payment prototype for Indonesia: QR inspection, an Indonesian AI Copilot, and merchant invoices
              with test-token payment proofs on BNB Smart Chain.
            </p>
            <div className="fade-up mt-8 flex flex-col items-center gap-3 md:items-start" style={{ animationDelay: "240ms" }}>
              <Link
                href="/demo"
                className="rounded-full bg-gold px-8 py-4 text-base font-semibold text-ink shadow-[0_12px_30px_-12px_rgba(231,163,58,0.65)] transition active:scale-[0.98]"
              >
                Try the two-minute demo
              </Link>
              <Link href="/merchant" className="text-sm text-emerald underline">Open Merchant Mode</Link>
              <p className="text-xs text-ink/40">Start without a wallet. Connect one to try test payments.</p>
            </div>
          </div>

          <div
            className="fade-up w-full max-w-[320px] shrink-0 overflow-hidden rounded-[28px] border-4 border-ink shadow-[10px_10px_0_rgba(16,30,26,0.85)] md:max-w-[380px]"
            style={{ animationDelay: "320ms" }}
          >
            <Image src="/illustrations/hero-success.jpg" alt="Illustration of a merchant and a customer exploring digital payments" width={760} height={760} className="h-auto w-full" priority />
          </div>
        </section>

        <section className="mt-20 md:mt-28">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center md:flex-row md:text-left">
            <div className="w-full max-w-[240px] shrink-0 overflow-hidden rounded-[24px] border-4 border-ink shadow-[8px_8px_0_rgba(16,30,26,0.85)]">
              <Image src="/illustrations/problem-hook.jpg" alt="Crypto stuck behind a wall, unable to reach a coffee shop" width={600} height={600} className="h-auto w-full" />
            </div>
            <div>
              <h2 className="font-display text-2xl italic text-ink md:text-3xl">The wall crypto hits every day.</h2>
              <p className="mt-3 text-sm text-ink/60 md:text-base">
                Wallet addresses, networks, token approvals and transaction hashes make digital payments hard to understand.
                Liber puts the amount, recipient and evidence into one clear flow. QRIS inspection and Liber invoices are separate:
                this demo does not settle QRIS or load a Kolo card.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-24 md:mt-32">
          <h2 className="text-center font-display text-2xl italic text-ink md:text-3xl">How it works</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3 md:gap-8">
            {STEPS.map(({ Icon, title, body }, i) => (
              <div key={title} className="relative rounded-3xl bg-white/90 p-6 shadow-[0_20px_45px_-25px_rgba(11,107,78,0.45)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald/10 text-emerald">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-sm italic text-ink/40">0{i + 1}</span>
                </div>
                <p className="mt-4 font-semibold text-ink">{title}</p>
                <p className="mt-2 text-sm text-ink/60">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 flex flex-wrap items-center justify-center gap-3 md:mt-20">
          {TRUST.map((label) => (
            <span key={label} className="rounded-full border border-ink/10 bg-white/60 px-4 py-2 text-xs font-semibold text-ink/60">
              {label}
            </span>
          ))}
        </section>

        <section className="mt-16 flex flex-col items-center gap-4 rounded-[32px] bg-emerald-deep px-8 py-12 text-center text-white md:mt-20">
          <p className="font-display text-2xl italic md:text-3xl">A clear amount. A visible proof.</p>
          <p className="max-w-md text-sm text-white/70">
            Inspect a sample QR, create a test invoice, and check what actually happened on BNB.
          </p>
          <Link
            href="/demo"
            className="mt-2 rounded-full bg-gold px-8 py-4 text-base font-semibold text-ink shadow-[0_12px_30px_-12px_rgba(231,163,58,0.65)] transition active:scale-[0.98]"
          >
            Try the demo
          </Link>
        </section>

        <footer className="mt-16 flex flex-col items-center gap-2 pb-8 text-center">
          <Logo className="h-6 w-6" />
          <p className="text-xs text-ink/40">Built on BNB Chain.</p>
        </footer>
      </div>
    </div>
  );
}
