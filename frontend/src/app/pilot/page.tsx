"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {PageShell} from "@/components/ui/PageShell";
import {PageHeading} from "@/components/ui/PageHeading";
import {ExampleProofs} from "@/components/ExampleProofs";
import {WorkspaceGuide} from "@/components/WorkspaceGuide";
import {Card} from "@/components/ui/Card";
import {Button} from "@/components/ui/Button";
import {selectWallet} from "@/lib/merchant";
import {authenticateWallet} from "@/lib/auth";
import type {ActiveWallet} from "@/lib/wallet/activeWallet";
import {getPilotConfig,getPilotOrders,createPilotOrder,rupiah,pilotStatus,type PilotConfig,type PilotOrder} from "@/lib/pilot";
type Draft={key:string;amount:number};
const draftKey=(address:string)=>`liber:pilot:draft:${address.toLowerCase()}`;
export default function PilotPage(){
  const [config,setConfig]=useState<PilotConfig|null>(null),[wallet,setWallet]=useState<ActiveWallet|null>(null),[orders,setOrders]=useState<PilotOrder[]>([]);
  const [amount,setAmount]=useState("10000"),[draft,setDraft]=useState<Draft|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[status,setStatus]=useState("");
  useEffect(()=>{getPilotConfig().then(setConfig).catch(()=>setError("Could not check the pilot connection. Try again later."));},[]);
  useEffect(()=>{if(!wallet)return;const timer=setInterval(()=>{if(document.visibilityState==="visible")getPilotOrders().then(r=>setOrders(r.orders)).catch(()=>setError("Invoice list could not refresh. Reconnect or refresh before relying on its status."));},20000);return()=>clearInterval(timer);},[wallet]);
  async function connect(external:boolean){setBusy(true);setError("");try{const active=await selectWallet(external);await authenticateWallet(active);const list=await getPilotOrders();setWallet(active);setOrders(list.orders);const saved=sessionStorage.getItem(draftKey(active.publicKey));if(saved){const pending=JSON.parse(saved) as Draft;setDraft(pending);setAmount(String(pending.amount));}}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function create(){if(!wallet||!config?.enabled)return;setBusy(true);setError("");try{
    const value=Number(amount);if(!/^\d+$/.test(amount)||!Number.isInteger(value)||value<1000||value>config.maxAmountIdr)throw Error(`Choose a whole-rupiah amount from Rp1,000 to ${rupiah(config.maxAmountIdr)}.`);
    const request=draft??{key:crypto.randomUUID(),amount:value};sessionStorage.setItem(draftKey(wallet.publicKey),JSON.stringify(request));setDraft(request);
    const order=await createPilotOrder(request.amount,request.key);setOrders(previous=>[order,...previous.filter(o=>o.id!==order.id)]);
    if(order.status==="creating")setStatus("Provider confirmation is taking longer. Resume this invoice after 30 seconds; it keeps the same order reference.");
    else {sessionStorage.removeItem(draftKey(wallet.publicKey));setDraft(null);setStatus("Invoice created. Share its checkout link with the buyer.");}
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <PageShell wide>
    <PageHeading eyebrow="QRIS workspace" title="QRIS sandbox. BNB receipts.">Create a test invoice. Share the checkout. Verify its receipt.</PageHeading>
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.15fr]">
      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Connection</h2><span className={`rounded-full px-3 py-1 text-xs font-semibold ${config?.enabled?"bg-emerald/10 text-emerald":"bg-paper text-ink/60"}`}>{config?config.enabled?config.environment==="production"?"Production":"Sandbox ready":"Unavailable":error?"Check failed":"Checking…"}</span></div>
          <p className="mt-3 text-sm text-ink/70">{config?.merchantName??"Liber · QRIS"}</p>
          <p className="mt-2 text-xs leading-relaxed text-ink/65">{!config&&!error?"Checking the payment environment and merchant connection…":config?.enabled?config.environment==="production"?"Payments use rupiah. Bank disbursement follows the merchant's Midtrans schedule.":"Midtrans sandbox. No real money or bank disbursement.":"The QRIS connection is unavailable. Completed test receipts remain accessible below."}</p>
        </Card>
        {config?.enabled&&!wallet&&<Card className="flex flex-col gap-3"><h2 className="font-semibold">Create an invoice</h2><p className="text-sm text-ink/60">Sign in with the configured merchant wallet.</p><Button disabled={busy} onClick={()=>connect(true)}>{busy?"Connecting…":"Sign in as pilot merchant"}</Button><Button variant="ghost" disabled={busy} onClick={()=>connect(false)}>Use device wallet to sign in</Button><p className="text-xs leading-relaxed text-ink/65">Sign a login message, not a transfer. Receipts are public.</p></Card>}
        {wallet&&<Card className="flex flex-col gap-3"><div className="flex items-center justify-between"><h2 className="font-semibold">Create an invoice</h2><button className="text-xs text-emerald underline" disabled={busy} onClick={()=>{setWallet(null);setOrders([]);setDraft(null);setStatus("");}}>Switch wallet</button></div><p className="break-all rounded-lg bg-paper p-3 font-mono text-xs text-ink/60">{wallet.publicKey}</p><label className="text-sm font-medium">Amount · IDR<input inputMode="numeric" className="mt-2 w-full rounded-xl border border-ink/10 bg-paper p-3" value={amount} disabled={!!draft} onChange={e=>setAmount(e.target.value)}/></label><p className="text-xs text-ink/65">Rp1.000 - {rupiah(config?.maxAmountIdr??100000)}</p><Button disabled={busy||!config?.enabled} onClick={create}>{busy?"Checking…":draft?"Resume same invoice":"Create QRIS invoice"}</Button><p className="text-xs leading-relaxed text-ink/65">A retry keeps the same invoice reference, including after a slow response.</p></Card>}
        {status&&<p role="status" className="rounded-xl bg-emerald/10 p-3 text-sm text-emerald">{status}</p>}{error&&<p role="alert" className="rounded-xl bg-rose/10 p-3 text-sm text-rose">{error}</p>}
      </div>
      <div className="space-y-4">
        <ExampleProofs/>
        {wallet?<Card><div className="flex items-center justify-between"><h2 className="font-semibold">Your invoices <span className="text-xs font-normal text-ink/65">({orders.length})</span></h2><button className="text-xs text-emerald underline" onClick={()=>getPilotOrders().then(r=>setOrders(r.orders)).catch(e=>setError(e.message))}>Refresh</button></div>{!orders.length&&<p className="py-8 text-center text-sm text-ink/65">Your first invoice will appear here.</p>}{orders.map(order=><div key={order.id} className="mt-4 border-t border-ink/10 pt-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold">{rupiah(order.amountIdr)}</p><span className="rounded-full bg-paper px-3 py-1 text-xs text-ink/60">{pilotStatus(order.status)}</span></div><p className="mt-1 font-mono text-[10px] text-ink/65">{order.id}</p><div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-emerald underline"><Link href={`/pilot/pay?id=${order.id}`}>Buyer checkout</Link><Link href={`/pilot/receipt?id=${order.id}`}>Payment evidence</Link><button onClick={()=>navigator.clipboard.writeText(`${location.origin}/pilot/pay?id=${order.id}`).then(()=>setStatus("Checkout link copied.")).catch(()=>setError("Open checkout and share its URL."))}>Copy link</button></div></div>)}</Card>:<WorkspaceGuide title="Try a checkout.">Share an invoice. Review the provider status. Open its BNB receipt.</WorkspaceGuide>}
        <p className="px-1 text-xs leading-relaxed text-ink/65">Midtrans confirms payments. BNB records receipt hashes, not fiat settlement. <Link href="/demo" className="text-emerald underline">Explore the walkthrough →</Link></p>
      </div>
    </div>
  </PageShell>;
}
