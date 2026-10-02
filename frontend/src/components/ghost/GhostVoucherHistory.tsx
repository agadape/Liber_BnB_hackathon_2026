"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {decodeEventLog,formatUnits,getAddress,type Address,type Hash} from "viem";
import {GhostShell} from "./GhostShell";
import {Card} from "../ui/Card";
import {Button} from "../ui/Button";
import {selectWallet} from "@/lib/merchant";
import type {ActiveWallet} from "@/lib/wallet/activeWallet";
import {getGhostConfig,ghostRpc} from "@/lib/ghost/config";
import {ghostAbi} from "@/lib/ghost/ghost-abi";
import {requireDeployedConfig,readGhostState,verifyGhostProof,type GhostConfig,type GhostState} from "@/lib/ghost/chain";
import {listJournals,saveJournal,type GhostJournal} from "@/lib/ghost/storage";
import {reclaimGhost,confirmGhost,expiryLabel,safeGhostError,ghostTxUrl,uiError} from "@/lib/ghost/transactions";
import {hashPattern} from "@/lib/ghost/codec";
import {authenticatedFetch} from "@/lib/auth";
type Item={journal:GhostJournal;state:GhostState|null};
export function GhostVoucherHistory(){
  const [config,setConfig]=useState<GhostConfig|null>(null),[wallet,setWallet]=useState<ActiveWallet|null>(null),[items,setItems]=useState<Item[]>([]),[hash,setHash]=useState("");
  const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[status,setStatus]=useState(""),[cursor,setCursor]=useState<string|null>(null);
  useEffect(()=>{getGhostConfig().then(setConfig).catch(()=>setError("Configuration could not be checked."));},[]);
  useEffect(()=>{const clear=()=>{setWallet(null);setItems([]);setCursor(null);};window.addEventListener("liber:ghost-clear-sensitive",clear);return()=>window.removeEventListener("liber:ghost-clear-sensitive",clear);},[]);
  function persist(row:GhostJournal){setItems(current=>current.map(item=>item.journal.id===row.id?{...item,journal:row}:item));try{saveJournal(row);}catch{setError("Browser storage is unavailable. Keep the reclaim transaction hash before leaving this page: "+row.reclaimTxHash);}}
  async function refresh(active=wallet){if(!active||!config?.vaultAddress)return;const rows=listJournals(config.vaultAddress,active.publicKey as Address);const found:Item[]=[];for(const journal of rows.slice(0,10)){let state:GhostState|null=null;try{state=await readGhostState(ghostRpc(),config,journal.id);}catch{/* Keep uncertain state visibly unverified. */}found.push({journal,state});}setItems(found);}
  async function connect(external:boolean){setBusy(true);setError(null);try{const active=await selectWallet(external);setWallet(active);await refresh(active);}catch(e){setError(safeGhostError(e));}finally{setBusy(false);}}
  async function recoverTx(){if(!wallet||!config)return;setBusy(true);setError(null);try{
    requireDeployedConfig(config);if(!hashPattern.test(hash))throw uiError("Enter a complete reserve transaction hash.");
    const receipt=await ghostRpc().getTransactionReceipt({hash:hash as Hash});let id:Hash|null=null;
    for(const log of receipt.logs){if(log.address.toLowerCase()!==config.vaultAddress.toLowerCase())continue;try{const e=decodeEventLog({abi:ghostAbi,eventName:"VoucherReserved",data:log.data,topics:log.topics});if(getAddress(e.args.owner)===getAddress(wallet.publicKey))id=e.args.voucherId;}catch{/* Not a matching reserve event. */}}
    if(!id)throw uiError("This transaction has no reservation for your connected wallet.");
    const proof=await verifyGhostProof(ghostRpc(),config,id,hash as Hash,"reserve");if(!proof.voucher)throw uiError("Reservation fields could not be recovered.");
    saveJournal({id,vault:config.vaultAddress,owner:proof.owner,voucher:proof.voucher,reserveTxHash:proof.txHash,createdAt:new Date().toISOString()});setStatus("Reservation recovered from its chain event. No new funds were reserved.");await refresh();
  }catch(e){setError(safeGhostError(e));}finally{setBusy(false);}}
  async function recoverHistory(){if(!wallet||!config)return;setBusy(true);setError(null);try{
    requireDeployedConfig(config);const base=process.env.NEXT_PUBLIC_BACKEND_URL;if(!base)throw uiError("History API unavailable. Recover using a reserve transaction hash instead.");
    const r=await authenticatedFetch(base+"/ghost/me/recover",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(cursor?{cursor}:{}),signal:AbortSignal.timeout(50_000)});
    if(r.status!==200)throw uiError(r.status===202?"Recovery proof is waiting for confirmations. Keep this page and retry verification.":r.status===429?"Recovery rate limit reached. Retry next minute.":"Verified history recovery is unavailable. Use the transaction-hash recovery below.");
    const result=await r.json();for(const proof of result.items??[]){if(proof.voucher&&getAddress(proof.owner)===getAddress(wallet.publicKey))saveJournal({id:proof.voucherId,vault:config.vaultAddress,owner:proof.owner,voucher:proof.voucher,reserveTxHash:proof.txHash,createdAt:new Date().toISOString()});}
    setCursor(result.next);setStatus(result.next?"Recovery page checked. Continue to inspect the next block range.":"Recovery reached the checked chain head.");await refresh();
  }catch(e){setError(safeGhostError(e));}finally{setBusy(false);}}
  async function reclaim(item:Item){if(!wallet||!config)return;setBusy(true);setError(null);let journal=item.journal;try{
    requireDeployedConfig(config);
    if(!journal.reclaimTxHash){setStatus("Confirm reclaim in your owner wallet…");const tx=await reclaimGhost(wallet,config,journal.id);journal={...journal,reclaimTxHash:tx};persist(journal);}
    setStatus("Checking reclaim confirmation. No transaction is being resent…");
    await confirmGhost(config,journal.id,journal.reclaimTxHash!,"reclaim",tx=>{journal={...journal,reclaimTxHash:tx};persist(journal);});
    setStatus("Unused funds returned to the original owner. Exact token transfer verified.");await refresh();
  }catch(e){setError(safeGhostError(e));}finally{setBusy(false);}}
  return <GhostShell title="Paper lost? Permission recoverable."><div className="ghost-columns"><div>
    {!wallet?<Card className="ghost-stack"><Button disabled={busy||!config?.vaultAddress||config.chainId!==97} onClick={()=>connect(true)}>Connect original owner</Button><Button variant="ghost" disabled={busy||!config?.vaultAddress||config.chainId!==97} onClick={()=>connect(false)}>Use device test wallet</Button>{config&&!config.enabled&&<p className="ghost-muted">{config.reason}</p>}</Card>:<Card><p className="ghost-muted">Original owner wallet</p><p className="ghost-address">{wallet.publicKey}</p><Button variant="ghost" className="mt-4" disabled={busy} onClick={()=>{setBusy(true);refresh().catch(e=>setError(safeGhostError(e))).finally(()=>setBusy(false));}}>Refresh chain states</Button></Card>}
    {wallet&&<Card className="mt-4 ghost-stack"><h2>Recover a reservation.</h2><label>Reserve transaction hash<input value={hash} onChange={e=>setHash(e.target.value)} placeholder="0x…" spellCheck={false}/></label><Button disabled={busy||!hash} onClick={recoverTx}>Recover from transaction</Button><Button variant="ghost" disabled={busy} onClick={recoverHistory}>{cursor?"Continue chain history recovery":"Recover verified chain history"}</Button><p className="ghost-muted">A lost QR or browser signature does not move your funds. Re-sign the same voucher to print it again, or reclaim unused funds after expiry. The original wallet key is still required.</p></Card>}
    <p role="status" className="ghost-status">{status}</p>{error&&<p role="alert" className="ghost-error">{error}</p>}
  </div><div className="ghost-stack">{wallet&&items.length===0&&<div className="ghost-paper-placeholder"><p className="ghost-display">Your paper trail<br/><em>starts here.</em></p><p>There are no locally saved vouchers for this wallet. Issue one or recover its reserve transaction.</p><Link className="landing-text-link" href="/ghost/create">Issue a voucher ↗</Link></div>}{items.map(item=><Card key={item.journal.id} className="ghost-stack"><div className="ghost-card-top"><h2>{formatUnits(BigInt(item.journal.voucher.amountRaw),18)} MockUSDC</h2><span className="ghost-status-tag">{item.state?.effectiveStatus.replaceAll("_"," ")??"unverified"}</span></div><p className="ghost-muted">Valid before {expiryLabel(item.journal.voucher.validBefore)}</p><p className="ghost-address">{item.journal.voucher.merchant}</p>{item.state?.effectiveStatus==="reserved"&&<Link className="landing-text-link" href={`/ghost/voucher?id=${item.journal.id}`}>Restore / print authorization ↗</Link>}{item.journal.reserveTxHash&&<a href={ghostTxUrl(item.journal.reserveTxHash)} className="landing-text-link" target="_blank" rel="noopener noreferrer">Reserve transaction ↗</a>}{(item.state?.effectiveStatus==="expired_reclaimable"||item.journal.reclaimTxHash)&&<Button disabled={busy} onClick={()=>reclaim(item)}>{item.journal.reclaimTxHash?"Verify saved reclaim":"Reclaim unused funds"}</Button>}<Link href={`/ghost/receipt?id=${item.journal.id}`} className="landing-text-link">Public state / proof ↗</Link></Card>)}</div></div></GhostShell>;
}
