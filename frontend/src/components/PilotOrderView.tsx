"use client";
import {useEffect,useState,Suspense} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {encodeFunctionData,type Hash} from "viem";
import {PageShell} from "./ui/PageShell";
import {Card} from "./ui/Card";
import {Button} from "./ui/Button";
import {getPilotConfig,getPilotOrder,refreshPilotOrder,verifyPilotRecord,pilotApi,pilotStatus,rupiah,receiptCommitment,validPilotId,type PilotOrder,type PilotConfig} from "@/lib/pilot";
import {receiptAbi} from "@/lib/receipt-abi";
import {selectWallet,publicRpc} from "@/lib/merchant";
import {sendActiveWallet} from "@/lib/wallet/activeWallet";
import {CHAIN,explorerTxUrl} from "@/lib/chain";
export function PilotOrderView({proof=false}:{proof?:boolean}){return <Suspense fallback={<PageShell>Reading invoice…</PageShell>}><RoutedOrder proof={proof}/></Suspense>;}
function RoutedOrder({proof}:{proof:boolean}){const id=useSearchParams().get("id")??"";return <OrderContent key={id} id={id} proof={proof}/>;}
function OrderContent({id,proof}:{id:string;proof:boolean}){
  const valid=validPilotId(id);
  const [order,setOrder]=useState<PilotOrder|null>(null),[config,setConfig]=useState<PilotConfig|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[qrFailed,setQrFailed]=useState(false),[status,setStatus]=useState(""),[hash,setHash]=useState("");
  useEffect(()=>{if(!valid)return;let alive=true,checking=false;
    const load=async()=>{try{const [data,c]=await Promise.all([getPilotOrder(id),getPilotConfig()]);if(alive){setOrder(data);setConfig(c);}}catch(e){if(alive)setError((e as Error).message);}};
    void load();const timer=setInterval(async()=>{if(!alive||checking||document.visibilityState!=="visible")return;checking=true;try{const updated=await refreshPilotOrder(id);if(alive){setOrder(updated);setError("");}}catch{if(alive)setError("Midtrans could not be checked. The displayed status is the last successful check.");}finally{checking=false;}},15000);
    return()=>{alive=false;clearInterval(timer);};
  },[id,valid]);
  async function refresh(){setBusy(true);setError("");try{setOrder(await refreshPilotOrder(id));setQrFailed(false);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  const latest=order?.receipts.find(r=>r.statement.status===order.status);
  const pendingKey=latest?`liber:pilot:record:${latest.id}`:"";
  async function confirm(tx:Hash){if(!latest)return;const receipt=await publicRpc().waitForTransactionReceipt({hash:tx,timeout:90000});if(receipt.status!=="success"){sessionStorage.removeItem(pendingKey);throw Error("Recording reverted. Payment status is unchanged.");}await verifyPilotRecord(id,latest.id,tx);sessionStorage.removeItem(pendingKey);setOrder(await getPilotOrder(id));setStatus("Receipt hash verified on BSC Testnet.");}
  async function record(external:boolean){if(!latest||!config?.registryAddress)return;setBusy(true);setError("");try{
    if(CHAIN.id!==97||config.registryChainId!==97)throw Error("Receipt recording requires BSC Testnet.");
    if(receiptCommitment(latest.statement)!==latest.commitment)throw Error("Receipt data does not match its hash.");
    const saved=sessionStorage.getItem(pendingKey);if(saved){await confirm(saved as Hash);return;}
    const wallet=await selectWallet(external);
    const existing=await publicRpc().readContract({address:config.registryAddress,abi:receiptAbi,functionName:"records",args:[latest.commitment]});
    if(existing[0]!=="0x0000000000000000000000000000000000000000")throw Error("This hash is already recorded. Enter its transaction hash below to recover the proof.");
    const tx=await sendActiveWallet(wallet,{to:config.registryAddress,data:encodeFunctionData({abi:receiptAbi,functionName:"record",args:[latest.commitment]})}) as Hash;
    sessionStorage.setItem(pendingKey,tx);setStatus(`Recording submitted: ${tx}. Retry confirmation without sending again.`);await confirm(tx);
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <PageShell><Link href="/pilot" className="text-sm text-emerald">← Merchant QRIS pilot</Link><p className="mt-6 text-xs uppercase tracking-widest text-emerald">{proof?"Payment evidence":"Buyer checkout"}</p><h1 className="mt-2 font-display text-4xl italic">{proof?<>Rupiah payment.<br/>A recorded receipt.</>:<>Review the invoice.<br/>Pay with QRIS.</>}</h1>
    {!valid&&<p role="alert" className="mt-5 text-sm text-rose">Invalid invoice link. Use the checkout shared by the merchant.</p>}
    {valid&&!order&&!error&&<p role="status" className="mt-5 text-sm text-ink/50">Reading invoice…</p>}
    {order&&<><Card className="mt-6 flex flex-col gap-3"><p className="text-xs uppercase text-ink/50">{order.merchantName}</p><p className="text-3xl font-semibold">{rupiah(order.amountIdr)}</p><p className="text-sm font-semibold text-emerald">{order.environment==="sandbox"?"Sandbox simulation · ":""}{pilotStatus(order.status)}</p><p className="text-xs text-ink/60">{order.environment==="sandbox"?"Testing only. Do not send real money to a sandbox QR.":"Pay in rupiah using your banking or e-wallet app. No crypto wallet is needed."}</p><p className="text-xs text-ink/50">Last provider check: {order.providerCheckedAt?new Date(order.providerCheckedAt).toLocaleString():"not confirmed yet"}</p>{order.status==="settlement"&&<p className="text-xs text-ink/60">Midtrans reports payment confirmation. Disbursement to the merchant&apos;s bank follows the provider schedule.</p>}{["refund","partial_refund"].includes(order.status)&&<p className="text-xs text-ink/60">This invoice has a refund update. Earlier recorded receipts describe its previous state.</p>}</Card>
    {!proof&&order.hasQr&&<Card className="mt-4 flex flex-col items-center gap-3">{!qrFailed?<img src={pilotApi(`/orders/${id}/qr`)} width={280} height={280} alt={`${order.environment==="sandbox"?"Sandbox test":"Midtrans"} QRIS invoice for ${rupiah(order.amountIdr)}`} onError={()=>setQrFailed(true)}/>:<p role="alert" className="text-sm text-rose">QR could not load. Refresh the invoice before paying.</p>}<p className="text-xs text-center text-ink/60">Confirm the merchant and amount in your payment app before authorizing.</p></Card>}
    {order.status==="creating"&&<p className="mt-4 text-sm text-ink/60">Provider confirmation is pending. The merchant can resume the same invoice; no payable QR has been issued here yet.</p>}
    <Button variant="ghost" className="mt-4" disabled={busy} onClick={refresh}>{busy?"Checking…":"Check directly with Midtrans"}</Button>
    {!proof&&<Link href={`/pilot/receipt?id=${id}`} className="mt-4 rounded-full bg-emerald px-5 py-3 text-center font-semibold text-white">Inspect payment evidence</Link>}
    {proof&&latest&&<Card className="mt-5 flex flex-col gap-3"><h2 className="font-semibold">{latest.txHash?"Receipt hash recorded":"Record the confirmed receipt"}</h2><p className="text-xs text-ink/60">BNB timestamps a receipt hash. Payment confirmation comes from Midtrans; recording the hash does not move rupiah or independently verify fiat settlement.</p><p className="break-all font-mono text-xs">{latest.commitment}</p>{latest.txHash?<a href={explorerTxUrl(latest.txHash)} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald underline">Inspect receipt recording on BscScan</a>:<>{config?.registryAddress&&<><Button disabled={busy} onClick={()=>record(true)}>Record / resume with connected wallet</Button><Button variant="ghost" disabled={busy} onClick={()=>record(false)}>Use device test wallet</Button><p className="text-xs text-ink/50">Requires TEST BNB gas on chain 97. Anyone may timestamp this public hash.</p></>}<label className="text-xs text-ink/50">Recover an existing recording<input className="mt-2 w-full rounded-xl bg-paper p-3 font-mono text-xs" placeholder="Transaction hash · 0x…" value={hash} onChange={e=>setHash(e.target.value)}/></label><Button variant="ghost" disabled={busy||!/^0x[a-fA-F0-9]{64}$/.test(hash)} onClick={async()=>{setBusy(true);setError("");try{await confirm(hash as Hash);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>Verify recording</Button></>}<a href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({statement:latest.statement,commitment:latest.commitment,txHash:latest.txHash},null,2))}`} download={`liber-receipt-${id}.json`} className="text-sm text-emerald underline">Download receipt statement</a></Card>}
    {proof&&order.receipts.length>1&&<Card className="mt-4"><h2 className="font-semibold">Previous receipt states</h2>{order.receipts.filter(r=>r.id!==latest?.id).map(r=><div key={r.id} className="mt-3 text-xs"><p>{pilotStatus(r.statement.status)} · {new Date(r.statement.observedAt).toLocaleString()}</p>{r.txHash&&<a href={explorerTxUrl(r.txHash)} className="text-emerald underline" target="_blank" rel="noopener noreferrer">Historical hash recording</a>}</div>)}</Card>}
    {proof&&!latest&&<p className="mt-5 text-sm text-ink/60">A confirmed provider receipt will appear after payment. No paid receipt has been claimed for this status.</p>}
    {proof&&<Link href={`/pilot/pay?id=${id}`} className="mt-5 text-center text-sm text-emerald underline">Back to checkout</Link>}
    </>}{status&&<p role="status" className="mt-4 break-all text-xs text-emerald">{status}</p>}{error&&<p role="alert" className="mt-4 text-sm text-rose">{error}</p>}
  </PageShell>;
}
