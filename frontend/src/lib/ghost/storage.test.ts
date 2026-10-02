import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { deserializeVoucher, voucherId } from "./codec";
import { saveJournal,getJournal,listJournals,journalKey,saveSignature,getSignature,clearGhostSignatures,type StorageLike,type GhostJournal } from "./storage";
const fixture=JSON.parse(readFileSync(new URL("../../../../protocol/fixtures/ghost-v1-golden.json",import.meta.url),"utf8"));
class Memory implements StorageLike { data=new Map<string,string>(); get length(){return this.data.size;}key(i:number){return [...this.data.keys()][i]??null;}getItem(k:string){return this.data.get(k)??null;}setItem(k:string,v:string){this.data.set(k,v);}removeItem(k:string){this.data.delete(k);} }
test("reload journal stores hashes and fields, never a signature or raw packet",()=>{
 const local=new Memory(),session=new Memory(),v=deserializeVoucher(fixture.voucher);
 const row:GhostJournal={id:voucherId(fixture.vault,v),vault:fixture.vault,owner:v.owner,voucher:fixture.voucher,reserveTxHash:"0x"+"a".repeat(64) as `0x${string}`,createdAt:new Date().toISOString()};
 saveJournal({...row,signature:fixture.signature,packet:fixture.packet} as GhostJournal,local);saveSignature(fixture.vault,v,fixture.signature,session);
 assert.deepEqual(getJournal(fixture.vault,v.owner,row.id,local),row);
 assert.equal(listJournals(fixture.vault,v.owner,local).length,1);
 assert.ok(![...local.data.values()].join("").includes(fixture.signature));
 assert.equal(getSignature(fixture.vault,v.owner,row.id,session),fixture.signature);
 session.setItem("unrelated","keep");clearGhostSignatures(session);
 assert.equal(getSignature(fixture.vault,v.owner,row.id,session),null);assert.equal(session.getItem("unrelated"),"keep");
 assert.equal(getJournal(fixture.vault,"0x3333333333333333333333333333333333333333",row.id,local),null);
 local.setItem(journalKey(fixture.vault,v.owner,row.id),JSON.stringify({...row,voucher:{...row.voucher,amountRaw:"6"}}));
 assert.equal(getJournal(fixture.vault,v.owner,row.id,local),null);
});
