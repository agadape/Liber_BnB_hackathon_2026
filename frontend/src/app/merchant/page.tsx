"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {encodeFunctionData,type Address,type Hash} from "viem";
import {PageShell} from "@/components/ui/PageShell";
import {PageHeading} from "@/components/ui/PageHeading";
import {ExampleProofs} from "@/components/ExampleProofs";
import {WorkspaceGuide} from "@/components/WorkspaceGuide";
import {Card} from "@/components/ui/Card";
import {Button} from "@/components/ui/Button";
import {getMerchantConfig,getInvoice,prepareInvoice,publicRpc,selectWallet,contractUrl,type Invoice,type MerchantConfig} from "@/lib/merchant";
import {sendActiveWallet,type ActiveWallet} from "@/lib/wallet/activeWallet";
import {invoiceAbi} from "@/lib/invoice-abi";
import {explorerTxUrl} from "@/lib/chain";
type Pending={id:Hash;hash:Hash;kind:"create"|"cancel"};
const listKey=(address:string)=>`liber:invoices:97:${address.toLowerCase()}`;
const pendingKey=(address:string)=>`${listKey(address)}:pending`;
export default function MerchantPage() {
  const [config,setConfig]=useState<MerchantConfig|null>(null),[wallet,setWallet]=useState<ActiveWallet|null>(null),[invoices,setInvoices]=useState<Invoice[]>([]);
  const [amount,setAmount]=useState("5"),[minutes,setMinutes]=useState("60"),[busy,setBusy]=useState(false),[status,setStatus]=useState(""),[error,setError]=useState<string|null>(null);
  const [pending,setPending]=useState<Pending|null>(null),[selected,setSelected]=useState<Invoice|null>(null),[qr,setQr]=useState("");
  useEffect(()=>{getMerchantConfig().then(setConfig).catch(e=>setError(e.message));},[]);
  async function refresh(active=wallet) {
    if(!active)return;
    const ids:Hash[]=JSON.parse(localStorage.getItem(listKey(active.publicKey)) ?? "[]");
    const loaded=await Promise.all(ids.slice(0,30).map(id=>getInvoice(id)));
    setInvoices(loaded);if(selected)setSelected(loaded.find(i=>i.id===selected.id)??selected);
  }
  async function connect(external:boolean) {
    setBusy(true);setError(null);
    try {const active=await selectWallet(external);setWallet(active);
      const raw=sessionStorage.getItem(pendingKey(active.publicKey));setPending(raw?JSON.parse(raw):null);await refresh(active);
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  async function confirm(operation:Pending) {
    if(!wallet)return;
    setStatus("Waiting for BNB confirmation…");
    const receipt=await publicRpc().waitForTransactionReceipt({hash:operation.hash,timeout:90_000});
    if(receipt.status!=="success"){sessionStorage.removeItem(pendingKey(wallet.publicKey));setPending(null);throw Error("Transaction reverted. No invoice change was completed.");}
    const invoice=await getInvoice(operation.id);
    if(operation.kind==="create") {
      if(invoice.merchant.toLowerCase()!==wallet.publicKey.toLowerCase())throw Error("Confirmed invoice belongs to another wallet.");
      const ids:Hash[]=JSON.parse(localStorage.getItem(listKey(wallet.publicKey)) ?? "[]");
      localStorage.setItem(listKey(wallet.publicKey),JSON.stringify(Array.from(new Set([operation.id,...ids]))));
      await showInvoice(invoice);
    }
    sessionStorage.removeItem(pendingKey(wallet.publicKey));setPending(null);await refresh();setStatus(operation.kind==="create"?"Invoice confirmed on BSC Testnet.":"Invoice cancelled on chain.");
  }
  async function showInvoice(invoice:Invoice) {setSelected(invoice);setQr(await QRCode.toDataURL(`${location.origin}/checkout?id=${invoice.id}`,{width:240,margin:2}));}
  async function create() {
    if(!wallet || !config?.contractAddress || pending)return;
    setBusy(true);setError(null);
    try {
      const draft=prepareInvoice(config.contractAddress,wallet.publicKey as Address,amount,Number(minutes));
      setStatus("Confirm invoice creation in your wallet…");
      const hash=await sendActiveWallet(wallet,draft.tx) as Hash;
      const operation:Pending={id:draft.id,hash,kind:"create"};sessionStorage.setItem(pendingKey(wallet.publicKey),JSON.stringify(operation));setPending(operation);await confirm(operation);
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  async function cancel(invoice:Invoice) {
    if(!wallet || !invoice.contractAddress || pending)return;
    setBusy(true);setError(null);
    try {setStatus("Confirm cancellation in your wallet…");const hash=await sendActiveWallet(wallet,{to:invoice.contractAddress,data:encodeFunctionData({abi:invoiceAbi,functionName:"cancelInvoice",args:[invoice.id]})}) as Hash;
      const operation:Pending={id:invoice.id,hash,kind:"cancel"};sessionStorage.setItem(pendingKey(wallet.publicKey),JSON.stringify(operation));setPending(operation);await confirm(operation);
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <PageShell wide><PageHeading eyebrow="BNB workspace" title="BNB invoices.">Set an amount and expiry. Share a test-token invoice.</PageHeading>
    <Link href="/ghost/merchant" className="landing-text-link mb-6">Redeem a Ghost paper voucher ↗</Link>
    <div className="grid items-start gap-8 lg:grid-cols-2"><div>
    <Link href="/demo/funds" className="mb-4 inline-block text-xs font-semibold text-emerald underline">Get demo tokens ↗</Link>
    {config && !config.contractAddress && <Card className="mt-5"><p className="font-semibold">Contract deployment pending</p><p className="mt-2 text-sm text-ink/60">Invoice creation is unavailable until the contract is configured.</p></Card>}
    {!wallet?<Card className="flex flex-col gap-3"><Button disabled={busy} onClick={()=>connect(true)}>Connect existing wallet</Button><Button variant="ghost" disabled={busy} onClick={()=>connect(false)}>Use this device&apos;s test wallet</Button><p className="text-xs text-ink/65">Your wallet needs test BNB for gas. Keys remain on your device.</p></Card>:<Card className=""><p className="text-xs text-ink/65">Receiving wallet · BSC Testnet</p><p className="mt-2 break-all font-mono text-xs">{wallet.publicKey}</p><Button className="mt-3" variant="ghost" disabled={busy || !!pending} onClick={()=>{setWallet(null);setInvoices([]);setSelected(null);}}>Switch wallet</Button></Card>}
    {wallet && <Card className="mt-4 flex flex-col gap-3"><h2 className="font-semibold">Create invoice</h2><label className="text-sm">Amount · MockUSDC<input className="mt-2 w-full rounded-xl bg-paper p-3" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label className="text-sm">Expires in<select className="mt-2 w-full rounded-xl bg-paper p-3" value={minutes} onChange={e=>setMinutes(e.target.value)}><option value="15">15 minutes</option><option value="60">1 hour</option><option value="1440">24 hours</option></select></label><Button disabled={busy || !!pending || !config?.contractAddress} onClick={create}>{busy?"Working…":"Create on BNB"}</Button><p className="text-xs text-ink/65">No service fee. The wallet pays test BNB gas.</p></Card>}
    {pending && <Card className="mt-4 flex flex-col gap-3"><p className="text-sm">Transaction submitted. Resume confirmation without sending again.</p><a href={explorerTxUrl(pending.hash)} className="text-sm text-emerald underline" target="_blank" rel="noopener noreferrer">View transaction</a><Button disabled={busy} onClick={async()=>{setBusy(true);setError(null);try{await confirm(pending);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>Resume confirmation</Button></Card>}
    {status && <p role="status" className="mt-4 text-sm text-emerald">{status}</p>}{error && <p role="alert" className="mt-4 text-sm text-rose">{error}</p>}
    </div><div><ExampleProofs/>
    {!wallet&&<div className="mt-4"><WorkspaceGuide title="Made to be shared.">Create a test invoice. Send its QR. Verify the payment on BNB.</WorkspaceGuide><details className="flow-explanation"><summary>Invoice rules</summary><ul className="mt-3 space-y-3 text-sm text-ink/60"><li>✓ Amount and receiving wallet fixed at creation</li><li>✓ Expired or cancelled invoices cannot be paid</li><li>✓ A paid invoice cannot be paid twice</li><li>✓ Receipt checks the invoice event and token transfer</li></ul><p className="my-4 text-xs text-ink/65">MockUSDC has no monetary value. Completed receipts are public.</p></details></div>}
    {selected && <Card className="mt-6 flex flex-col items-center gap-3"><p className="font-semibold">Share invoice · {selected.amountUsdc} MockUSDC</p>{qr && <img src={qr} alt="Liber test invoice QR" width={240} height={240} />}
      <p className="text-xs text-ink/65">Invoice QR, not a QRIS payment code</p><Link href={`/checkout?id=${selected.id}`} className="text-sm text-emerald underline">Open buyer checkout</Link><Button variant="ghost" onClick={async()=>{try{await navigator.clipboard.writeText(`${location.origin}/checkout?id=${selected.id}`);setStatus("Invoice link copied.");}catch{setError("Could not copy. Open checkout and share its URL.");}}}>Copy invoice link</Button></Card>}
    {wallet && <div className="mt-6"><div className="flex justify-between"><h2 className="font-semibold">Your invoices</h2><button className="text-sm text-emerald underline" disabled={busy} onClick={()=>refresh().catch(e=>setError(e.message))}>Refresh</button></div><p className="mt-1 text-xs text-ink/65">Saved on this device. Statuses checked on BNB.</p>{invoices.length===0 && <p className="mt-4 text-sm text-ink/65">Create your first test invoice above.</p>}{invoices.map(invoice=><Card key={invoice.id} className="mt-3"><div className="flex justify-between"><p className="font-semibold">{invoice.amountUsdc} MockUSDC</p><span className="text-xs uppercase text-emerald">{invoice.status}</span></div><p className="mt-1 text-xs text-ink/65">Expires {new Date(invoice.expiresAt*1000).toLocaleString()}</p><div className="mt-3 flex gap-4"><button className="text-sm text-emerald underline" onClick={()=>showInvoice(invoice)}>Share / inspect</button><Link className="text-sm text-emerald underline" href={`/receipt?id=${invoice.id}`}>Proof</Link>{invoice.status==="open" && <button className="text-sm text-rose underline" disabled={busy || !!pending} onClick={()=>cancel(invoice)}>Cancel</button>}</div></Card>)}</div>}
    {config?.contractAddress && <a href={contractUrl(config.contractAddress)} className="mt-6 inline-flex min-h-11 items-center text-xs text-emerald underline" target="_blank" rel="noopener noreferrer">View invoice contract ↗</a>}
    </div></div>
  </PageShell>;
}
