"use client";

import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";
import { Button } from "@/components/ui/Button";

export default function PageError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageShell><section className="liber-fallback"><div><p className="page-eyebrow">Page interrupted</p><h1>Let’s pick up<br />the trail.</h1><p>This page could not finish loading. Retry the page, or return to the workspace. If you submitted a transaction, check its saved hash before sending again.</p><div className="demo-links"><Button onClick={reset}>Retry page</Button><Link href="/ghost">Ghost workspace ↗</Link></div></div></section></PageShell>;
}
