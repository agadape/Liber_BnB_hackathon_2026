"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {PageShell} from "@/components/ui/PageShell";
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
  return <PageShell><Link href="/demo" className="text-sm text-emerald">← Liber</Link><p className="mt-6 text-xs uppercase tracking-widest text-emerald">Merchant QRIS pilot</p><h1 className="mt-2 font-display text-4xl italic">Invoice rupiah.<br/>Bukti yang jelas.</h1><p className="mt-3 text-sm text-ink/60">QRIS through Midtrans, with an optional receipt hash on BNB. Buyers pay with their banking or e-wallet app.</p>
    <Card className="mt-6 flex flex-col gap-3"><p className="font-semibold">{config?config.enabled?`${config.merchantName} · ${config.environment==="production"?"Production enabled":"Sandbox testing"}`:"Pilot not connected yet":"Checking connection…"}</p><p className="text-sm text-ink/60">{config?.enabled?config.environment==="production"?"Payments use rupiah. Bank disbursement follows the merchant's Midtrans settlement schedule.":"Sandbox transactions are simulations. No real money moves.":"A merchant Midtrans account must be connected before QRIS invoices can be issued. Production requires account approval."}</p>{!config?.enabled&&<a href="https://dashboard.midtrans.com" target="_blank" rel="noopener noreferrer" className="text-sm text-emerald underline">Merchant account setup at Midtrans</a>}</Card>
    {config?.enabled&&!wallet&&<Card className="mt-4 flex flex-col gap-3"><Button disabled={busy} onClick={()=>connect(true)}>Sign in as pilot merchant</Button><Button variant="ghost" disabled={busy} onClick={()=>connect(false)}>Use device wallet to sign in</Button><p className="text-xs text-ink/50">Wallet sign-in identifies the configured merchant. It does not authorize a payment.</p></Card>}
    {wallet&&<Card className="mt-4 flex flex-col gap-3"><p className="break-all font-mono text-xs">{wallet.publicKey}</p><label className="text-sm">Invoice amount · IDR<input inputMode="numeric" className="mt-2 w-full rounded-xl bg-paper p-3" value={amount} disabled={!!draft} onChange={e=>setAmount(e.target.value)}/></label><Button disabled={busy||!config?.enabled} onClick={create}>{busy?"Checking…":draft?"Resume same invoice":"Create QRIS invoice"}</Button><p className="text-xs text-ink/50">Each retry uses the same invoice reference. A slow response does not create another invoice.</p></Card>}
    {status&&<p role="status" className="mt-4 text-sm text-emerald">{status}</p>}{error&&<p role="alert" className="mt-4 text-sm text-rose">{error}</p>}
    {wallet&&<section className="mt-6"><div className="flex justify-between"><h2 className="font-semibold">Your invoices</h2><button className="text-sm text-emerald underline" onClick={()=>getPilotOrders().then(r=>setOrders(r.orders)).catch(e=>setError(e.message))}>Refresh</button></div>{!orders.length&&<p className="mt-3 text-sm text-ink/50">Your first invoice will appear here.</p>}{orders.map(order=><Card key={order.id} className="mt-3 flex flex-col gap-3"><p className="font-semibold">{rupiah(order.amountIdr)}</p><p className="text-sm text-ink/60">{order.environment==="sandbox"?"Sandbox · ":""}{pilotStatus(order.status)}</p><div className="flex gap-4 text-sm text-emerald underline"><Link href={`/pilot/pay?id=${order.id}`}>Buyer checkout</Link><Link href={`/pilot/receipt?id=${order.id}`}>Payment evidence</Link><button onClick={()=>navigator.clipboard.writeText(`${location.origin}/pilot/pay?id=${order.id}`).then(()=>setStatus("Checkout link copied.")).catch(()=>setError("Open checkout and share its URL."))}>Copy link</button></div></Card>)}</section>}
    <Card className="mt-6"><h2 className="font-semibold">What BNB records</h2><p className="mt-2 text-sm text-ink/60">A hash of a provider-confirmed receipt can be timestamped on BSC Testnet. Payment status comes from Midtrans. The blockchain does not independently verify QRIS settlement.</p></Card><Link href="/merchant" className="mt-5 text-center text-sm text-emerald underline">Explore the separate MockUSDC invoice demo</Link>
  </PageShell>;
}
