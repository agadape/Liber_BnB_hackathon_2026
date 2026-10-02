"use client";
import {useEffect,useState} from "react";
import {formatUnits,type Hash} from "viem";
import {GhostShell} from "./GhostShell";
import {Card} from "../ui/Card";
import {Button} from "../ui/Button";
import {readPublicGhost} from "@/lib/ghost/api";
import {getGhostConfig,ghostRpc} from "@/lib/ghost/config";
import {readGhostState,type GhostState,type GhostProof} from "@/lib/ghost/chain";
import {ghostTxUrl,expiryLabel} from "@/lib/ghost/transactions";
export function GhostProofView({id}:{id:Hash|null}){
  const [state,setState]=useState<GhostState|null>(null),[proofs,setProofs]=useState<GhostProof[]>([]),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false);
  async function refresh(){if(!id)return;setBusy(true);setError(null);setState(null);setProofs([]);try{const result=await readPublicGhost(id);setState(result);setProofs(result.proofs);}catch{try{const config=await getGhostConfig();const result=await readGhostState(ghostRpc(),config,id);setState(result);setProofs([]);setError("History is unavailable. Live contract state is shown, without a verified transaction proof.");}catch{setState(null);setProofs([]);setError("Voucher proof cannot be checked right now. No successful payment is being claimed.");}}finally{setBusy(false);}}
  useEffect(()=>{let live=true;if(id)readPublicGhost(id).then(result=>{if(live){setState(result);setProofs(result.proofs);}}).catch(()=>{if(live)setError("Public proof is not available yet. Refresh to check chain state.");});return()=>{live=false;};},[id]);
  const paid=proofs.find(p=>p.action==="redeem"),returned=proofs.find(p=>p.action==="reclaim");
  return <GhostShell title={paid?"Permission used. Payment proven.":returned?"Unused funds returned.":"Check the paper trail."}><Card className="ghost-proof-card ghost-stack">{!id?<p role="alert">Invalid voucher ID.</p>:<><p className="page-eyebrow">{paid?"VERIFIED TOKEN PAYMENT":returned?"VERIFIED RECLAIM":"LIVE STATE / PROOF PENDING"}</p>{state&&<><p className="ghost-amount">{formatUnits(BigInt(state.amountRaw),18)}<small>MockUSDC</small></p><dl className="ghost-review"><dt>Contract state</dt><dd>{state.effectiveStatus.replaceAll("_"," ")}</dd><dt>Merchant</dt><dd className="ghost-address">{state.merchant}</dd><dt>Owner</dt><dd className="ghost-address">{state.owner}</dd><dt>Valid before</dt><dd>{expiryLabel(state.validBefore)}</dd><dt>Checked block</dt><dd>{state.checkedBlockNumber}</dd></dl></>}<p className="ghost-address">{id}</p>{proofs.map(proof=><a key={proof.action} className="landing-text-link" href={ghostTxUrl(proof.txHash)} target="_blank" rel="noopener noreferrer">{proof.action} · {proof.confirmations} confirmations ↗</a>)}{!paid&&!returned&&<p className="ghost-muted">Contract state and confirmed token transfer proof are shown separately. This page does not verify goods delivery or rupiah payment.</p>}<Button variant="ghost" disabled={busy} onClick={refresh}>{busy?"Checking…":"Refresh verification"}</Button></>}{error&&<p role="status" className="ghost-error">{error}</p>}</Card></GhostShell>;
}
