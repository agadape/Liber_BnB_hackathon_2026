"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeading } from "@/components/ui/PageHeading";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CopilotCard, type Inspection } from "@/components/CopilotCard";
import Image from "next/image";
import { DEMO_LINKS } from "@/lib/demo-links";
import { GhostDemo } from "@/components/ghost/GhostDemo";

const views = [ {id:"ghost",name:"Ghost Protocol"}, {id:"qris",name:"QRIS sandbox"}, {id:"bnb",name:"BNB invoice"}, {id:"checks",name:"QR checks"} ] as const;
type View = typeof views[number]["id"];
export default function DemoPage() {return <Suspense fallback={<PageShell>Opening demo…</PageShell>}><DemoContent/></Suspense>;}
function DemoContent() {
  const requested = useSearchParams().get("view");
  const [selected,setSelected]=useState<View|null>(null);
  const view=selected ?? (requested==="checks"||requested==="bnb"||requested==="qris"?requested:"ghost");
  const [result,setResult]=useState<Inspection|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[rejected,setRejected]=useState(false);
  async function trySample(sample:"valid"|"corrupt") {
    setBusy(true);setError(null);setResult(null);setRejected(false);
    try {const res=await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/copilot/demo`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sample}),signal:AbortSignal.timeout(25_000)});const body=await res.json();
      if(!res.ok){if(sample==="corrupt" && res.status===400){setRejected(true);setError(body.error);}else throw Error(body.error||"Could not inspect this sample.");}
      else setResult(body);
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  const steps=view==="qris"?[ ["Create", "Merchant signs in and creates a rupiah invoice."], ["Confirm", "Midtrans confirms a simulated QRIS payment."], ["Record", "A receipt hash is timestamped on BSC Testnet."] ]:[ ["Create", "Merchant sets recipient, amount and expiry on BNB."], ["Pay", "Buyer approves the exact MockUSDC amount and signs."], ["Verify", "Receipt checks the invoice event and token transfer."] ];
  return <PageShell wide>
    <PageHeading eyebrow="Demo" title="Choose your demo.">Explore completed payments or inspect a sample QR. No wallet needed.</PageHeading>
    <nav aria-label="Demo flows" className="flow-tabs">{views.map(tab => <button key={tab.id} aria-current={view === tab.id ? "page" : undefined} onClick={() => setSelected(tab.id)}>{tab.name}</button>)}</nav>
    {view === "ghost" ? <GhostDemo/> : view !== "checks" ? <section className="demo-stage">
      <div>
        <p className="demo-amount">{view === "qris" ? "Rp10.000" : "5 MockUSDC"}<small>{view === "qris" ? "Completed sandbox payment" : "Completed BNB test payment"}</small></p>
        <h2 className="mt-7 font-display text-3xl">{view === "qris" ? "QRIS, with a public receipt." : "A payment you can verify."}</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/65">{view === "qris" ? "Midtrans confirms the sandbox payment. BNB timestamps its receipt hash." : "The receipt matches the invoice event and exact token transfer."}</p>
        <div className="demo-links"><Link className="action-link bg-emerald-deep text-paper" href={view === "qris" ? DEMO_LINKS.sandboxReceipt : DEMO_LINKS.tokenReceipt}>View receipt ↗</Link><Link href={view === "qris" ? "/pilot" : "/merchant"}>{view === "qris" ? "Open QRIS workspace" : "Create a BNB invoice"} ↗</Link></div>
        <p className="mt-5 max-w-md text-xs leading-relaxed text-ink/65">{view === "qris" ? "Sandbox only. No real money or bank disbursement." : "MockUSDC has no monetary value and does not settle QRIS."}</p>
        <details className="flow-explanation"><summary>How it works</summary><ol>{steps.map(([title, body]) => <li key={title}><h3 className="font-semibold">{title}</h3><p>{body}</p></li>)}</ol><a href={view === "qris" ? DEMO_LINKS.registry : DEMO_LINKS.invoiceContract} target="_blank" rel="noopener noreferrer" className="inline-block pb-5 text-xs text-emerald underline">Inspect the BNB contract ↗</a></details>
      </div>
      <Image src={view === "qris" ? "/illustrations/hero-success.jpg" : "/illustrations/mascot-guide.jpg"} alt={view === "qris" ? "Illustrated Indonesian merchant holding a QR code outside her food stall" : "Liber's coin mascot waving hello"} width={1000} height={1000} sizes="(max-width: 1023px) 280px, 360px" className="demo-art" />
    </section> : <div className="grid items-start gap-8 lg:grid-cols-2">
      <Card><h2 className="font-display text-3xl">Know what you scan.</h2><p className="mt-3 text-sm text-ink/65">Try a synthetic QR. Check the merchant, amount and checksum.</p><div className="mt-6 flex flex-col gap-3"><Button disabled={busy} onClick={() => trySample("valid")}>{busy ? "Checking…" : "Check sample · Rp25.000"}</Button><Button variant="ghost" disabled={busy} onClick={() => trySample("corrupt")}>Try corrupted sample</Button></div><p className="mt-5 text-xs leading-relaxed text-ink/65">No payment is sent. A valid checksum does not authenticate a merchant or guarantee safety.</p></Card>
      <div aria-live="polite">{!result && !error && <Card className="flex min-h-48 flex-col justify-center"><h2 className="font-semibold">Your QR check appears here.</h2><p className="mt-2 text-sm text-ink/65">Choose a sample to begin.</p></Card>}{error && <Card className={rejected ? "border-emerald/30" : "border-rose/30"}><h2 className="font-semibold">{rejected ? "Corrupted QR rejected" : "Could not complete the check"}</h2><p className="mt-2 text-sm text-ink/70">{error}</p></Card>}{result && <div className="space-y-4"><Card><p className="text-xs text-ink/65">Synthetic merchant</p><h2 className="mt-2 text-lg font-semibold">{result.facts.merchantName}</h2><p className="mt-1 text-sm text-ink/65">{result.facts.merchantCity} · Rp{Number(result.facts.amountIdr).toLocaleString("id-ID")}</p><p className="mt-3 text-xs text-ink/65">{result.quote ? `Reference estimate: ${result.quote.amountUsdc} USDC. Not a conversion or payment.` : "Reference rate temporarily unavailable"}</p></Card><CopilotCard inspection={result} /></div>}</div>
    </div>}
    <Link href="/demo/funds" className="mt-8 inline-flex min-h-11 items-center text-sm text-emerald underline underline-offset-4">Get demo tokens ↗</Link>
  </PageShell>;
}
