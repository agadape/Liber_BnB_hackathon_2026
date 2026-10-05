"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/nav/BottomNav";
import { useSessionStatus } from "@/lib/useSessionStatus";
import { hasApiSession, authenticateWallet } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/ui/PageShell";
import { ReceiptSkeleton } from "@/components/ui/ReceiptSkeleton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useSessionStatus();
  const [auth, setAuth] = useState<"checking" | "ready" | "signin" | "signing">("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    hasApiSession().then((valid) => { if (!cancelled) setAuth(valid ? "ready" : "signin"); });
    const requireSignIn = () => setAuth("signin");
    window.addEventListener("liber:auth-required", requireSignIn);
    return () => { cancelled = true; window.removeEventListener("liber:auth-required", requireSignIn); };
  }, []);

  useEffect(() => {
    if (session === false) {
      router.replace("/");
    }
  }, [router, session]);

  if (session !== true) return <PageShell><ReceiptSkeleton label="Checking your wallet session…" /></PageShell>;
  if (auth !== "ready") return <PageShell>
    <h1 className="font-display text-2xl italic text-ink">Verify your wallet</h1>
    <p className="my-4 text-sm text-ink/60">Sign a message to access your account and saved transfer destination. Your signature does not authorize a transfer.</p>
    {error && <p role="alert" className="mb-4 text-sm text-rose">{error}</p>}
    <Button disabled={auth === "checking" || auth === "signing"} onClick={async () => {
      setAuth("signing"); setError(null);
      try { await authenticateWallet(); setAuth("ready"); }
      catch (err) { setError((err as Error).message); setAuth("signin"); }
    }}>{auth === "signing" ? "Verifying..." : "Verify wallet"}</Button>
  </PageShell>;

  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
