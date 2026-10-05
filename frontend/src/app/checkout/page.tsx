"use client";
import {useEffect,useState,Suspense} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {erc20Abi,type Address,type Hash} from "viem";
import {PageShell} from "@/components/ui/PageShell";
import {PageHeading} from "@/components/ui/PageHeading";
import {Card} from "@/components/ui/Card";
import {ReceiptSkeleton} from "@/components/ui/ReceiptSkeleton";
import {Button} from "@/components/ui/Button";
import {getInvoice,verifyInvoice,selectWallet,publicRpc,approvalTx,invoicePaymentTx,type Invoice} from "@/lib/merchant";
import {sendActiveWallet,type ActiveWallet} from "@/lib/wallet/activeWallet";
import {explorerTxUrl} from "@/lib/chain";
type Pending={kind:"approval"|"payment";hash:Hash};
const pendingKey=(id:string,address:string)=>`liber:checkout:97:${id}:${address.toLowerCase()}`;
export default function CheckoutPage(){return <Suspense fallback={<PageShell><ReceiptSkeleton label="Loading invoice…"/></PageShell>}><RoutedCheckout/></Suspense>;}
function RoutedCheckout(){const id=useSearchParams().get("id")??"";return <CheckoutContent key={id} id={id}/>;}
function CheckoutContent({id}:{id:string}) {
  const validId=/^0x[a-fA-F0-9]{64}$/.test(id);
  const [invoice,setInvoice]=useState<Invoice|null>(null),[wallet,setWallet]=useState<ActiveWallet|null>(null),[pending,setPending]=useState<Pending|null>(null);
  const [busy,setBusy]=useState(false),[approved,setApproved]=useState(false),[status,setStatus]=useState(""),[error,setError]=useState<string|null>(null);
  useEffect(()=>{if(!/^0x[a-fA-F0-9]{64}$/.test(id))return;getInvoice(id).then(setInvoice).catch(e=>setError(e.message));},[id]);
  async function connect(external:boolean){setBusy(true);setError(null);try{const active=await selectWallet(external);setWallet(active);const raw=sessionStorage.getItem(pendingKey(id,active.publicKey));setPending(raw?JSON.parse(raw):null);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function confirm(operation:Pending) {
    if(!wallet)return;
    setStatus("Waiting for BNB confirmation…");
    const receipt=await publicRpc().waitForTransactionReceipt({hash:operation.hash,timeout:90_000});
    if(receipt.status!=="success"){sessionStorage.removeItem(pendingKey(id,wallet.publicKey));setPending(null);throw Error("Transaction reverted. No payment was completed.");}
    if(operation.kind==="payment") {
      const verified=await verifyInvoice(id,operation.hash);setInvoice(verified);setStatus("Payment verified: token transfer and invoice event match.");
    }else {setApproved(true);setStatus("Exact amount approved. Review the recipient, then sign payment.");}
    sessionStorage.removeItem(pendingKey(id,wallet.publicKey));setPending(null);
  }
  async function pay(){
    if(!wallet || pending)return;setBusy(true);setError(null);
    try {
      const fresh=await getInvoice(id);setInvoice(fresh);
      if(fresh.status!=="open" || !fresh.tokenAddress || !fresh.contractAddress)throw Error("Invoice is no longer payable.");
      if(wallet.publicKey.toLowerCase()===fresh.merchant.toLowerCase())throw Error("Use a different buyer wallet. Merchants cannot pay their own invoice.");
      const rpc=publicRpc();
      const [allowance,balance]=await Promise.all([
        rpc.readContract({address:fresh.tokenAddress,abi:erc20Abi,functionName:"allowance",args:[wallet.publicKey as Address,fresh.contractAddress]}),
        rpc.readContract({address:fresh.tokenAddress,abi:erc20Abi,functionName:"balanceOf",args:[wallet.publicKey as Address]})]);
      if(balance<BigInt(fresh.amountRaw))throw Error("Not enough MockUSDC. Get test tokens before continuing.");
      const kind=allowance<BigInt(fresh.amountRaw)?"approval":"payment";
      setStatus(kind==="approval"?"Approve only this invoice amount in your wallet…":"Sign the test payment in your wallet…");
      const hash=await sendActiveWallet(wallet,kind==="approval"?approvalTx(fresh):invoicePaymentTx(fresh)) as Hash;
      const operation:Pending={kind,hash};sessionStorage.setItem(pendingKey(id,wallet.publicKey),JSON.stringify(operation));setPending(operation);await confirm(operation);
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  async function faucet(){if(!wallet || !invoice?.tokenAddress)return;setBusy(true);setError(null);try{const {encodeFunctionData}=await import("viem");const hash=await sendActiveWallet(wallet,{to:invoice.tokenAddress,data:encodeFunctionData({abi:[{name:"faucet",type:"function",stateMutability:"nonpayable",inputs:[],outputs:[]}],functionName:"faucet"})}) as Hash;setStatus(`Test token request submitted: ${hash}`);const receipt=await publicRpc().waitForTransactionReceipt({hash});if(receipt.status!=="success")throw Error("Test token request reverted. No tokens received.");setStatus("Test tokens received. Check the invoice before paying.");}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <PageShell><PageHeading eyebrow="BNB checkout" title="Review your invoice.">Check the recipient and amount. TEST BNB pays the gas.</PageHeading>
    {validId&&!invoice&&!error&&<ReceiptSkeleton label="Reading the invoice recipient, amount and expiry…"/>}
    {invoice && <Card className=""><p className="text-xs uppercase text-ink/65">Invoice amount</p><p className="mt-2 text-3xl font-semibold">{invoice.amountUsdc} <span className="text-base">MockUSDC</span></p><span className="mt-3 inline-block rounded-full bg-emerald/10 px-3 py-1 text-xs uppercase text-emerald">{invoice.status}</span><p className="mt-4 text-xs text-ink/65">Receiving wallet · identity not verified</p><p className="mt-2 break-all font-mono text-xs">{invoice.merchant}</p><p className="mt-3 text-xs text-ink/65">Expires {new Date(invoice.expiresAt*1000).toLocaleString()}</p></Card>}
    {invoice?.status==="open" && !wallet && <Card className="mt-4 flex flex-col gap-3"><Button disabled={busy} onClick={()=>connect(true)}>Connect buyer wallet</Button><Button variant="ghost" disabled={busy} onClick={()=>connect(false)}>Use this device&apos;s test wallet</Button></Card>}
    {wallet && invoice?.status==="open" && <Card className="mt-4 flex flex-col gap-3"><p className="text-xs text-ink/65">Paying wallet</p><p className="break-all font-mono text-xs">{wallet.publicKey}</p><p className="text-xs text-ink/60">First approve the exact amount, then sign payment. Your wallet pays test BNB gas.</p><Button disabled={busy || !!pending} onClick={pay}>{busy?"Confirming…":approved?`Pay ${invoice.amountUsdc} MockUSDC`:`Approve / pay ${invoice.amountUsdc} MockUSDC`}</Button><Button variant="ghost" disabled={busy || !!pending} onClick={faucet}>Get test MockUSDC</Button><a href="https://www.bnbchain.org/en/testnet-faucet" target="_blank" rel="noopener noreferrer" className="text-xs text-emerald underline">Need test BNB for gas?</a></Card>}
    {pending && <Card className="mt-4 flex flex-col gap-3"><p className="text-sm">{pending.kind==="approval"?"Approval":"Payment"} submitted. Retry confirmation without sending again.</p><a href={explorerTxUrl(pending.hash)} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald underline">Inspect submitted transaction</a><Button disabled={busy} onClick={async()=>{setBusy(true);setError(null);try{await confirm(pending);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>Resume confirmation</Button></Card>}
    {!validId && <p role="alert" className="mt-4 text-sm text-rose">Invalid invoice link. Open the checkout link shared by the merchant.</p>}
    {status && <p role="status" className="mt-4 text-sm text-emerald">{status}</p>}{error && <p role="alert" className="mt-4 text-sm text-rose">{error}</p>}
    {invoice && <Link href={`/receipt?id=${invoice.id}`} className="action-link mt-5 bg-emerald text-paper">Inspect payment proof</Link>}
    <p className="mt-5 text-xs text-ink/65">MockUSDC has no monetary value. This flow does not settle QRIS.</p>
  </PageShell>;
}
