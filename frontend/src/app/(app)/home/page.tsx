"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeading } from "@/components/ui/PageHeading";
import { Card } from "@/components/ui/Card";
import { GradientBalanceCard } from "@/components/ui/GradientBalanceCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { ScanIcon, SendIcon, ReceiveIcon } from "@/components/icons";
import { getBalance, getHistory, type HistoryEntry } from "@/lib/api";

import { TOKEN_LABEL, IS_TESTNET } from "@/lib/chain";

const USER_ID_KEY = "liber:userId";

export default function HomePage() {
  const [balance, setBalance] = useState<{ usdcBalance: string; idrEstimate: string } | null>(null);
  const [recent, setRecent] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const userId = window.localStorage.getItem(USER_ID_KEY);
    if (!userId) return;

    getBalance(userId)
      .then(setBalance)
      .catch(() => setBalance({ usdcBalance: "0.00", idrEstimate: "0" }));

    getHistory(userId)
      .then((entries) => setRecent(entries.slice(0, 3)))
      .catch(() => setRecent([]));
  }, []);

  return (
    <PageShell>
      <PageHeading title="Your wallet." />

      <div className="mt-4">
        {balance ? (
          <GradientBalanceCard usdcBalance={balance.usdcBalance} idrEstimate={balance.idrEstimate} />
        ) : (
          <div className="h-40 animate-pulse rounded-2xl bg-ink/5" />
        )}
      </div>

      <Link
        href="/profile"
        className="action-link mt-4 border border-ink/15 text-emerald"
      >
        <ReceiveIcon className="h-5 w-5 text-emerald" />
        Receive {TOKEN_LABEL}
      </Link>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link href="/pilot" className="rounded-2xl border border-emerald/20 bg-surface p-4"><p className="text-sm font-semibold text-emerald">QRIS sandbox →</p><p className="mt-1 text-xs text-ink/65">Rupiah test invoices</p></Link>
        <Link href="/merchant" className="rounded-2xl border border-ink/10 bg-surface p-4"><p className="text-sm font-semibold">BNB invoices →</p><p className="mt-1 text-xs text-ink/65">MockUSDC on chain</p></Link>
      </div>
      <Link href="/demo" className="mt-4 text-center text-xs text-emerald underline">Explore completed test receipts ↗</Link>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink/70">Recent activity</h2>
        <Link href="/history" className="text-sm text-emerald underline underline-offset-4">
          See all
        </Link>
      </div>

      <ul className="mt-3 flex flex-col gap-3">
        {recent.length === 0 && <p className="text-sm text-ink/65">No activity yet.</p>}
        {recent.map((entry) => (
          <li key={entry.id}>
            <Card className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald/10 text-emerald">
                {entry.type === "scan" ? <ScanIcon className="h-4 w-4" /> : <SendIcon className="h-4 w-4" />}
              </span>
              <div className="flex-1">
                <p className="font-medium text-ink">{entry.type === "scan" ? entry.merchantName : IS_TESTNET ? "Test transfer" : "Token transfer"}</p>
                <p className="text-xs text-ink/65">{new Date(entry.createdAt).toLocaleDateString("en-GB")}</p>
              </div>
              <StatusPill state={entry.type} label={entry.type === "scan" ? "QRIS" : entry.verified ? "Verified" : "Unverified"} />
            </Card>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
