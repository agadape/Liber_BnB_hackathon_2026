"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeading } from "@/components/ui/PageHeading";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CopilotCard, type Inspection } from "@/components/CopilotCard";
import { ExampleProofs } from "@/components/ExampleProofs";
import { DEMO_LINKS } from "@/lib/demo-links";

const views = [ {id:"qris",name:"QRIS sandbox"}, {id:"bnb",name:"BNB invoice"}, {id:"checks",name:"QR checks"} ] as const;
type View = typeof views[number]["id"];
export default function DemoPage() {return <Suspense fallback={<PageShell>Opening demo…</PageShell>}><DemoContent/></Suspense>;}
function DemoContent() {
  const requested = useSearchParams().get("view");
  const [selected,setSelected]=useState<View|null>(null);
  const view=selected ?? (requested==="checks"||requested==="bnb"?requested:"qris");
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
    <PageHeading eyebrow="Hackathon walkthrough" title="Try it. Then verify it.">Inspect completed test runs without a wallet, or connect yours to create a new invoice.</PageHeading>
    <nav aria-label="Demo flows" className="mb-6 grid grid-cols-3 gap-1 rounded-xl border border-ink/10 bg-white p-1">{views.map(tab=><button key={tab.id} aria-current={view===tab.id?"page":undefined} onClick={()=>setSelected(tab.id)} className={`rounded-lg px-2 py-3 text-xs font-semibold transition sm:text-sm ${view===tab.id?"bg-emerald text-white":"text-ink/60 hover:bg-paper"}`}>{tab.name}</button>)}</nav>
    {view!=="checks"?<div className="grid items-start gap-5 lg:grid-cols-[1.25fr_1fr]">
      <Card className="sm:p-7"><span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold">{view==="qris"?"Rp10.000 · completed sandbox run":"5 MockUSDC · completed test payment"}</span><h2 className="mt-5 font-display text-3xl">{view==="qris"?"From rupiah invoice to public receipt.":"A merchant invoice, enforced on BNB."}</h2><p className="mt-3 text-sm leading-relaxed text-ink/60">{view==="qris"?"This example was paid in the official Midtrans sandbox simulator. Its confirmed receipt hash is recorded in the Liber receipt registry.":"This invoice was paid on BSC Testnet. The receipt checks the contract event, token, amount, payer and recipient against the transfer."}</p><Link className="action-link mt-6 w-full bg-gold text-ink" href={view==="qris"?DEMO_LINKS.sandboxReceipt:DEMO_LINKS.tokenReceipt}>Inspect completed receipt ↗</Link><p className="mt-3 text-xs leading-relaxed text-ink/50">{view==="qris"?"BNB timestamps the receipt hash; the payment status comes from Midtrans. No real money or bank disbursement.":"MockUSDC has no monetary value. This flow does not settle a QRIS payment."}</p></Card>
      <div className="space-y-4"><Card><h2 className="text-sm font-semibold">The flow</h2><ol className="mt-4 space-y-4">{steps.map(([title,body],i)=><li key={title} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald/10 text-xs font-semibold text-emerald">{i+1}</span><div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-relaxed text-ink/60">{body}</p></div></li>)}</ol><Link href={view==="qris"?"/pilot":"/merchant"} className="action-link mt-6 w-full bg-emerald text-white">{view==="qris"?"Open QRIS workspace":"Create a BNB invoice"} →</Link></Card><a href={view==="qris"?DEMO_LINKS.registry:DEMO_LINKS.invoiceContract} target="_blank" rel="noopener noreferrer" className="block text-center text-xs text-emerald underline">Inspect the BNB contract ↗</a></div>
    </div>:<div className="grid items-start gap-5 lg:grid-cols-2"><Card><h2 className="text-xl font-semibold">Inspect before paying.</h2><p className="mt-2 text-sm text-ink/60">Synthetic QR samples with a merchant, amount and checksum. No payment is sent.</p><div className="mt-5 flex flex-col gap-3"><Button disabled={busy} onClick={()=>trySample("valid")}>{busy?"Checking…":"Try valid sample · Rp25.000"}</Button><Button variant="ghost" disabled={busy} onClick={()=>trySample("corrupt")}>Try corrupted sample</Button></div><p className="mt-4 text-xs leading-relaxed text-ink/50">Checksum checks detect altered data. They do not authenticate a merchant or guarantee a safe payment.</p></Card><div aria-live="polite">{!result&&!error&&<Card className="flex min-h-48 flex-col justify-center border-dashed text-center"><span className="text-2xl text-emerald">◎</span><h2 className="mt-3 text-sm font-semibold">Your QR check appears here</h2><p className="mt-2 text-xs text-ink/55">Choose a sample to see its facts and checks.</p></Card>}{error&&<Card className={rejected?"border-emerald/30":"border-rose/30"}><h2 className="font-semibold">{rejected?"Corrupted QR rejected ✓":"Could not complete the check"}</h2><p className="mt-2 text-sm text-ink/70">{error}</p></Card>}{result&&<div className="space-y-4"><Card><p className="text-xs uppercase tracking-widest text-ink/50">Synthetic merchant</p><h2 className="mt-2 text-lg font-semibold">{result.facts.merchantName}</h2><p className="mt-1 text-sm text-ink/60">{result.facts.merchantCity} · Rp{Number(result.facts.amountIdr).toLocaleString("id-ID")}</p><p className="mt-3 text-xs text-ink/55">{result.quote?`Reference estimate: ${result.quote.amountUsdc} USDC · not a conversion or payment`:"Reference rate temporarily unavailable"}</p></Card><CopilotCard inspection={result}/></div>}</div></div>}
    <div className="mt-6"><ExampleProofs/></div>
  </PageShell>;
}
