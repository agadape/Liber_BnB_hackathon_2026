"use client";
import {useEffect,useState,Suspense} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {PageShell} from "@/components/ui/PageShell";
import {PageHeading} from "@/components/ui/PageHeading";
import {Card} from "@/components/ui/Card";
import {Button} from "@/components/ui/Button";
import {getInvoice,verifyInvoice,contractUrl,type Invoice} from "@/lib/merchant";
import {explorerTxUrl} from "@/lib/chain";
export default function ReceiptPage(){return <Suspense fallback={<PageShell>Reading payment proof…</PageShell>}><ReceiptContent/></Suspense>;}
function ReceiptContent(){
  const id=useSearchParams().get("id") ?? "";
  const validId=/^0x[a-fA-F0-9]{64}$/.test(id);
  const [invoice,setInvoice]=useState<Invoice|null>(null),[hash,setHash]=useState(""),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false);
  async function load(key:string){setBusy(true);setError(null);try{const result=await getInvoice(key);setInvoice(result);if(result.txHash)setInvoice(await verifyInvoice(key,result.txHash));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  useEffect(()=>{if(!/^0x[a-fA-F0-9]{64}$/.test(id))return;getInvoice(id).then(async result=>{setInvoice(result);if(result.txHash)setInvoice(await verifyInvoice(id,result.txHash));}).catch(e=>setError(e.message));},[id]);
  return <PageShell><PageHeading eyebrow="BNB receipt" title="Payment receipt.">Inspect the invoice state and transfer receipt. No wallet needed.</PageHeading>
    {invoice && <Card className="flex flex-col gap-4"><span className="self-start rounded-full bg-emerald/10 px-3 py-1 text-xs uppercase text-emerald">{invoice.verified?"Receipt verified":invoice.status==="paid"?"Paid on chain · receipt needed":invoice.status}</span><p className="text-3xl font-semibold">{invoice.amountUsdc} <span className="text-base">MockUSDC</span></p><dl className="flex flex-col gap-3 text-xs"><div><dt className="text-ink/65">Recipient</dt><dd className="mt-1 break-all font-mono">{invoice.merchant}</dd></div>{invoice.payer && <div><dt className="text-ink/65">Payer</dt><dd className="mt-1 break-all font-mono">{invoice.payer}</dd></div>}<div><dt className="text-ink/65">Network / latest checked block</dt><dd className="mt-1">BSC Testnet · chain 97 · #{invoice.checkedBlock}</dd></div><div><dt className="text-ink/65">Invoice ID</dt><dd className="mt-1"><details><summary className="cursor-pointer text-emerald">Show full reference</summary><p className="mt-2 break-all font-mono">{invoice.id}</p></details></dd></div></dl>{invoice.verified && <p className="text-sm text-emerald">✓ Successful receipt<br/>✓ Matching invoice payment event<br/>✓ Exact token transfer to recipient</p>}{invoice.txHash && <a href={explorerTxUrl(invoice.txHash)} target="_blank" rel="noopener noreferrer" className="action-link bg-emerald-deep text-paper">Inspect transaction on BscScan ↗</a>}{invoice.contractAddress && <a href={contractUrl(invoice.contractAddress)} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald underline">Inspect invoice contract</a>}</Card>}
    {invoice?.paid && !invoice.verified && <Card className="mt-4 flex flex-col gap-3"><p className="text-sm">Have the payment hash? Verify and recover its public receipt.</p><input aria-label="Payment transaction hash" className="rounded-xl bg-paper p-3 text-xs" placeholder="0x…" value={hash} onChange={e=>setHash(e.target.value)}/><Button disabled={busy || !/^0x[a-fA-F0-9]{64}$/.test(hash)} onClick={async()=>{setBusy(true);setError(null);try{setInvoice(await verifyInvoice(id,hash));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>Verify receipt</Button></Card>}
    {!validId && <p role="alert" className="mt-4 text-sm text-rose">Invalid invoice link. Open a shared Liber receipt.</p>}{error && <p role="alert" className="mt-4 text-sm text-rose">{error}</p>}<Button variant="ghost" className="mt-5" disabled={busy || !validId} onClick={()=>load(id)}>{busy?"Reading BNB…":"Refresh from BNB"}</Button><Link href={`/checkout?id=${id}`} className="mt-4 text-center text-sm text-emerald underline">Back to invoice</Link><p className="mt-5 text-xs text-ink/65">Test token transfer only. This receipt does not verify merchant identity, goods delivery or QRIS settlement.</p>
  </PageShell>;
}
