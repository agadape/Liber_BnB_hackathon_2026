import {authenticatedFetch} from "../auth";
import {serializeVoucher,type GhostVoucher} from "./codec";
import type {GhostAction,GhostProof,GhostState,GhostConfig} from "./chain";
import type {Hash} from "viem";
const base=()=>process.env.NEXT_PUBLIC_BACKEND_URL;
export async function syncGhostProof(id:Hash,hash:Hash,action:GhostAction,voucher?:GhostVoucher):Promise<void> {
  if(!base())throw Error("History sync unavailable");
  const path=action==="reserve"?"/ghost/reservations/verify":`/ghost/vouchers/${id}/proofs`;
  const body=action==="reserve"?{voucher:serializeVoucher(voucher!),txHash:hash}:{action,txHash:hash};
  const r=await authenticatedFetch(base()+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(25_000)});
  if(r.status!==200)throw Error("History sync unavailable");
}
export async function readPublicGhost(id:Hash):Promise<GhostState&GhostConfig&{proofs:GhostProof[]}> {
  const r=await fetch(base()+`/ghost/vouchers/${id}`,{cache:"no-store",signal:AbortSignal.timeout(25_000)});
  if(!r.ok)throw Error("Public history is unavailable; inspect the testnet contract directly.");
  return r.json();
}
