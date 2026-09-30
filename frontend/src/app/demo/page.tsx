"use client";
import {useState} from "react";
import Link from "next/link";
import {PageShell} from "@/components/ui/PageShell";
import {Card} from "@/components/ui/Card";
import {Button} from "@/components/ui/Button";
import {CopilotCard,type Inspection} from "@/components/CopilotCard";
export default function DemoPage() {
  const [result,setResult]=useState<Inspection|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[rejected,setRejected]=useState(false);
  async function trySample(sample:"valid"|"corrupt") {
    setBusy(true);setError(null);setResult(null);setRejected(false);
    try {const res=await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/copilot/demo`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sample}),signal:AbortSignal.timeout(25_000)});const body=await res.json();
      if(!res.ok){if(sample==="corrupt" && res.status===400){setRejected(true);setError(body.error);}else throw Error(body.error);}
      else setResult(body);
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <PageShell>
    <Link href="/" className="text-sm text-emerald">← Liber</Link>
    <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-emerald">Two-minute walkthrough</p>
    <h1 className="mt-2 font-display text-4xl italic">Scan. Understand.<br/>Verify.</h1>
    <p className="mt-3 text-sm text-ink/60">Start without a wallet. These are synthetic QR samples, never a real merchant payment.</p>
    <Card className="mt-6 flex flex-col gap-3"><h2 className="font-semibold">1 · Inspect a QR</h2><p className="text-sm text-ink/60">Compare an intact sample with one whose checksum was changed.</p>
      <Button disabled={busy} onClick={()=>trySample("valid")}>{busy?"Checking…":"Try valid sample · Rp25,000"}</Button><Button variant="ghost" disabled={busy} onClick={()=>trySample("corrupt")}>Try corrupted sample</Button>
    </Card>
    {error && <Card className={`mt-4 ${rejected?"border border-emerald/20":"border border-rose/20"}`}><p className="font-semibold">{rejected?"Corrupted QR rejected":"Could not complete the check"}</p><p role="status" className="mt-2 text-sm text-ink/70">{error}</p></Card>}
    {result && <div className="mt-4 flex flex-col gap-3"><Card><p className="text-xs uppercase text-ink/50">Synthetic merchant</p><h2 className="mt-1 font-semibold">{result.facts.merchantName}</h2><p className="text-sm text-ink/60">{result.facts.merchantCity} · Rp{Number(result.facts.amountIdr).toLocaleString("id-ID")}</p><p className="mt-3 text-sm">{result.quote?`Reference estimate: ${result.quote.amountUsdc} USDC`:"Reference rate temporarily unavailable"}</p></Card><CopilotCard inspection={result}/></div>}
    <Card className="mt-6 flex flex-col gap-3"><h2 className="font-semibold">2 · Create a test invoice</h2><p className="text-sm text-ink/60">Connect a wallet with test BNB. Create an invoice, then share its Liber QR with another test wallet.</p><Link href="/merchant" className="rounded-full bg-emerald px-5 py-3 text-center font-semibold text-white">Open Merchant Mode</Link></Card>
    <Card className="mt-4 flex flex-col gap-3"><h2 className="font-semibold">3 · Confirm on BNB</h2><p className="text-sm text-ink/60">The buyer approves the exact token amount, signs payment, and checks the receipt. Merchant status is read from the contract.</p><p className="text-xs text-ink/45">Invoice Liber is a separate BSC testnet flow. It does not settle QRIS or credit a Kolo card.</p><a href="https://www.bnbchain.org/en/testnet-faucet" target="_blank" rel="noopener noreferrer" className="text-sm text-emerald underline">Get test BNB from the official faucet</a></Card>
    <Link href="/onboarding" className="mt-6 text-center text-sm text-emerald underline">Open the full wallet app</Link>
  </PageShell>;
}
