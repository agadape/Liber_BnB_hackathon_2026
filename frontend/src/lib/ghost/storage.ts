import type {Address,Hash,Hex} from "viem";
import {deserializeVoucher,serializeVoucher,voucherId,normalizeSignature,type GhostVoucher} from "./codec";
export interface GhostJournal {id:Hash;vault:Address;owner:Address;voucher:ReturnType<typeof serializeVoucher>;reserveTxHash?:Hash;approvalTxHash?:Hash;redeemTxHash?:Hash;reclaimTxHash?:Hash;createdAt:string}
export interface StorageLike {getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void;length:number;key(index:number):string|null}
const prefix=(vault:Address,owner:Address)=>`liber:ghost:v1:97:${vault.toLowerCase()}:${owner.toLowerCase()}:`;
export function journalKey(vault:Address,owner:Address,id:Hash):string{return prefix(vault,owner)+id.toLowerCase();}
export function saveJournal(journal:GhostJournal,store:StorageLike=localStorage):void {
  const v=deserializeVoucher(journal.voucher);
  if(journal.id.toLowerCase()!==voucherId(journal.vault,v).toLowerCase() || journal.owner.toLowerCase()!==v.owner.toLowerCase())throw Error("Invalid voucher journal.");
  const safe:GhostJournal={id:journal.id,vault:journal.vault,owner:journal.owner,voucher:serializeVoucher(v),createdAt:journal.createdAt};
  for(const key of ["reserveTxHash","approvalTxHash","redeemTxHash","reclaimTxHash"] as const)if(journal[key])safe[key]=journal[key];
  store.setItem(journalKey(safe.vault,safe.owner,safe.id),JSON.stringify(safe));
}
export function getJournal(vault:Address,owner:Address,id:Hash,store:StorageLike=localStorage):GhostJournal|null {
  try {
    const raw=store.getItem(journalKey(vault,owner,id));if(!raw)return null;
    const journal=JSON.parse(raw) as GhostJournal;const v=deserializeVoucher(journal.voucher);
    if(journal.owner.toLowerCase()!==owner.toLowerCase() || journal.vault.toLowerCase()!==vault.toLowerCase() || voucherId(vault,v).toLowerCase()!==id.toLowerCase())return null;
    return journal;
  }catch{return null;}
}
export function listJournals(vault:Address,owner:Address,store:StorageLike=localStorage):GhostJournal[] {
  const found:GhostJournal[]=[];const start=prefix(vault,owner);
  for(let i=0;i<store.length;i++){const key=store.key(i);if(key?.startsWith(start)){const row=getJournal(vault,owner,key.slice(start.length) as Hash,store);if(row)found.push(row);}}
  return found.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
export function saveSignature(vault:Address,v:GhostVoucher,signature:Hex,store:StorageLike=sessionStorage):void {store.setItem("sig:"+journalKey(vault,v.owner,voucherId(vault,v)),normalizeSignature(signature));}
export function getSignature(vault:Address,owner:Address,id:Hash,store:StorageLike=sessionStorage):Hex|null {try{const raw=store.getItem("sig:"+journalKey(vault,owner,id));return raw?normalizeSignature(raw as Hex):null;}catch{return null;}}
export function clearGhostSignatures(store:StorageLike=sessionStorage):void {const keys:string[]=[];for(let i=0;i<store.length;i++){const k=store.key(i);if(k?.startsWith("sig:liber:ghost:"))keys.push(k);}keys.forEach(k=>store.removeItem(k));}
