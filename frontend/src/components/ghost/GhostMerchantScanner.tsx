"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {formatUnits,getAddress,type Hash} from "viem";
import {GhostShell} from "./GhostShell";
import {Card} from "../ui/Card";
import {Button} from "../ui/Button";
import {QrScanner} from "../QrScanner";
import {getGhostConfig,ghostRpc} from "@/lib/ghost/config";
import {decodePacket,type GhostPacket} from "@/lib/ghost/codec";
import {readGhostState,assertReservationMatches,requireReadyConfig,type GhostConfig,type GhostState,type GhostProof} from "@/lib/ghost/chain";
import {selectWallet} from "@/lib/merchant";
import type {ActiveWallet} from "@/lib/wallet/activeWallet";
import {redeemGhost,confirmGhost,expiryLabel,safeGhostError,ghostTxUrl,uiError} from "@/lib/ghost/transactions";
import {syncGhostProof} from "@/lib/ghost/api";
type Pending={id:Hash;hash:Hash;merchant:string};
const pendingKey=(vault:string,merchant:string)=>`liber:ghost:merchant:97:${vault.toLowerCase()}:${merchant.toLowerCase()}:pending`;
export function GhostMerchantScanner(){
  const [config,setConfig]=useState<GhostConfig|null>(null),[wallet,setWallet]=useState<ActiveWallet|null>(null),[camera,setCamera]=useState(false),[raw,setRaw]=useState("");
  const [packet,setPacket]=useState<GhostPacket|null>(null),[state,setState]=useState<GhostState|null>(null),[pending,setPending]=useState<Pending|null>(null),[proof,setProof]=useState<GhostProof|null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[status,setStatus]=useState(""),[sync,setSync]=useState("");
  useEffect(()=>{getGhostConfig().then(setConfig).catch(()=>setError("Ghost configuration could not be checked."));},[]);
  useEffect(()=>{const clear=()=>{setPacket(null);setRaw("");setCamera(false);setWallet(null);};window.addEventListener("liber:ghost-clear-sensitive",clear);return()=>window.removeEventListener("liber:ghost-clear-sensitive",clear);},[]);
  async function connect(external:boolean){setBusy(true);setError(null);try{const active=await selectWallet(external);setWallet(active);if(config?.vaultAddress){try{const saved=JSON.parse(sessionStorage.getItem(pendingKey(config.vaultAddress,active.publicKey))??"null");if(saved?.merchant===active.publicKey&&/^0x[a-fA-F0-9]{64}$/.test(saved.id)&&/^0x[a-fA-F0-9]{64}$/.test(saved.hash))setPending(saved);}catch{/* No usable saved pending proof. */}}}catch(e){setError(safeGhostError(e));}finally{setBusy(false);}}
  const inspect=useCallback(async(text:string)=>{
    setCamera(false);setRaw("");setBusy(true);setError(null);setPacket(null);setState(null);setProof(null);
    try{
      if(!config)throw uiError("Wait for Ghost configuration.");requireReadyConfig(config);
      const decoded=await decodePacket(text,config.vaultAddress);
      if(!wallet || getAddress(wallet.publicKey)!==decoded.voucher.merchant)throw uiError("Connect the merchant wallet printed on this voucher.");
      const current=await readGhostState(ghostRpc(),config,decoded.id);assertReservationMatches(current,decoded.voucher,config);
      setState(current);
      if(current.effectiveStatus==="redeemed"){setStatus("Already redeemed. No new transaction will be sent.");return;}
      if(current.effectiveStatus!=="reserved")throw uiError(current.effectiveStatus==="expired_reclaimable"?"Expired. The owner can reclaim its funds.":"This voucher is not available for redemption.");
      const gas=await ghostRpc().getBalance({address:decoded.voucher.merchant});if(gas===0n)throw uiError("Merchant needs TEST BNB for redemption gas.");
      setPacket(decoded);setStatus("Reservation found on chain. Review before redeeming; payment is confirmed only after the transfer.");
    }catch(e){setError(safeGhostError(e));}finally{setBusy(false);}
  },[config,wallet]);
  const cameraError=useCallback((message:string)=>{setCamera(false);setError(message);},[]);
  function persistPending(operation:Pending){setPending(operation);if(config?.vaultAddress){try{sessionStorage.setItem(pendingKey(config.vaultAddress,operation.merchant),JSON.stringify(operation));}catch{setStatus("Transaction submitted. Keep its hash; browser storage is unavailable.");}}}
  async function confirm(operation:Pending){
    if(!config)return;setStatus("Checking redemption and 12 confirmations. No transaction is being resent…");
    const result=await confirmGhost(config,operation.id,operation.hash,"redeem",hash=>{operation={...operation,hash};persistPending(operation);});
    setProof(result);setPacket(null);setPending(null);setStatus("Payment confirmed. The merchant received the exact test-token amount.");
    if(config.vaultAddress)sessionStorage.removeItem(pendingKey(config.vaultAddress,operation.merchant));
  }
  async function redeem(){if(!wallet||!config||!packet||pending)return;setBusy(true);setError(null);try{setStatus("Approve redemption in the merchant wallet…");const hash=await redeemGhost(wallet,config,packet.voucher,packet.signature);const operation={id:packet.id,hash,merchant:wallet.publicKey};persistPending(operation);await confirm(operation);}catch(e){setError(safeGhostError(e));}finally{setBusy(false);}}
  async function upload(file:File){setBusy(true);setError(null);try{if(file.size>8_000_000)throw uiError("Use a QR image smaller than 8 MB.");const {Html5Qrcode}=await import("html5-qrcode");const scanner=new Html5Qrcode("ghost-file-reader");try{const text=await scanner.scanFile(file,false);await inspect(text);}finally{scanner.clear();}}catch(e){setError(safeGhostError(e));}finally{setBusy(false);}}
  async function syncHistory(){if(!proof)return;setBusy(true);try{await syncGhostProof(proof.voucherId,proof.txHash,"redeem");setSync("Redemption synced to verified history.");}catch{setSync("History sync unavailable. The on-chain payment is unaffected.");}finally{setBusy(false);}}
  return <GhostShell title="Paper in. Permission verified."><div className="ghost-columns"><div>
    {config&&!config.enabled&&<Card><h2>Redemption is preparing for launch.</h2><p className="ghost-muted">{config.reason}</p></Card>}
    {!wallet?<Card className="ghost-stack"><Button disabled={busy||!config?.enabled} onClick={()=>connect(true)}>Connect merchant wallet</Button><Button variant="ghost" disabled={busy||!config?.enabled} onClick={()=>connect(false)}>Use device test wallet</Button></Card>:<Card><p className="ghost-muted">Receiving wallet · needs TEST BNB for gas</p><p className="ghost-address">{wallet.publicKey}</p></Card>}
    {wallet&&!pending&&!proof&&<Card className="mt-4 ghost-stack">{camera?<QrScanner onScan={inspect} onError={cameraError}/>:<Button disabled={busy} onClick={()=>{setPacket(null);setState(null);setCamera(true);}}>Scan paper voucher</Button>}<label className="ghost-file-input">Or choose a QR image<input type="file" accept="image/*" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value="";}}/></label><details><summary>Paste a Ghost code</summary><textarea value={raw} onChange={e=>setRaw(e.target.value.slice(0,1024))} rows={3} spellCheck={false} autoComplete="off" aria-label="Ghost voucher payload"/><Button variant="ghost" disabled={busy||!raw} onClick={()=>inspect(raw)}>Verify pasted code</Button></details><div id="ghost-file-reader" hidden/></Card>}
    {pending&&<Card className="mt-4 ghost-stack"><h2>Redemption submitted.</h2><p className="ghost-muted">Resume its confirmation without scanning or sending again.</p><a className="ghost-address" href={ghostTxUrl(pending.hash)} target="_blank" rel="noopener noreferrer">{pending.hash}</a><Button disabled={busy} onClick={async()=>{setBusy(true);setError(null);try{await confirm(pending);}catch(e){setError(safeGhostError(e));}finally{setBusy(false);}}}>Check saved transaction</Button></Card>}
    <p role="status" className="ghost-status">{status}</p>{error&&<p role="alert" className="ghost-error">{error}</p>}<p className="ghost-muted">Buyer can be offline. This merchant device must stay online. A signature alone is not payment.</p>
  </div><div>
    {packet&&state&&<Card className="ghost-stack"><p className="page-eyebrow">MERCHANT-BOUND AUTHORIZATION</p><p className="ghost-amount">{formatUnits(packet.voucher.amount,18)}<small>MockUSDC</small></p><dl className="ghost-review"><dt>Merchant</dt><dd className="ghost-address">{packet.voucher.merchant}</dd><dt>Owner</dt><dd className="ghost-address">{packet.voucher.owner}</dd><dt>Valid before</dt><dd>{expiryLabel(packet.voucher.validBefore)}</dd></dl><Button disabled={busy||!!pending} onClick={redeem}>Redeem once</Button><p className="ghost-muted">The merchant signs this claim and pays TEST BNB gas. Token transfer publishes the voucher signature on chain.</p></Card>}
    {state?.effectiveStatus==="redeemed"&&!proof&&<Card><h2>Already redeemed.</h2><Link className="landing-text-link" href={`/ghost/receipt?id=${state.voucherId}`}>Check public history ↗</Link></Card>}
    {proof&&<Card className="ghost-stack"><p className="page-eyebrow">PAYMENT CONFIRMED</p><p className="ghost-amount">{formatUnits(BigInt(proof.amountRaw),18)}<small>MockUSDC received</small></p><p className="ghost-muted">Voucher event and exact token transfer checked. {proof.confirmations} confirmations observed.</p><a className="landing-text-link" href={ghostTxUrl(proof.txHash)} target="_blank" rel="noopener noreferrer">Inspect transaction ↗</a><Link className="landing-text-link" href={`/ghost/receipt?id=${proof.voucherId}`}>Public proof page ↗</Link><Button variant="ghost" disabled={busy} onClick={syncHistory}>Sync verified history</Button>{sync&&<p className="ghost-muted">{sync}</p>}<Button onClick={()=>{setProof(null);setState(null);setPacket(null);setStatus("");}}>Scan another voucher</Button></Card>}
    {!packet&&!proof&&!state&&<div className="ghost-paper-placeholder"><p className="ghost-display">A dead phone.<br/><em>A live permission.</em></p><p>The code fixes the amount and recipient. The contract decides whether it can still be used.</p><Link className="landing-text-link" href="/demo/funds">Get merchant test gas ↗</Link></div>}
  </div></div></GhostShell>;
}
