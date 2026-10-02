import { test,before,after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { authHeaders } from "../auth/test-helpers.js";
import { getPool } from "../db/pool.js";
import { migrate } from "../db/migrate.js";
import { createGhostRoute } from "./ghost.js";
import { ghostConfig } from "../ghost/config.js";
import { deserializeVoucher } from "../ghost/codec.js";
import { GhostChainError,type GhostProof } from "../ghost/chain.js";
const f=JSON.parse(readFileSync(new URL("../../../protocol/fixtures/ghost-v1-golden.json",import.meta.url),"utf8"));
const tx="0x"+"a".repeat(64) as `0x${string}`;
let saves=0,proves=0,limited=false,pending=false;
const config=()=>ghostConfig({GHOST_ENABLED:"true",GHOST_VAULT_ADDRESS:f.vault,GHOST_TOKEN_ADDRESS:"0x4444444444444444444444444444444444444444",GHOST_VAULT_DEPLOYMENT_BLOCK:"1",GHOST_SERVER_HMAC_SECRET:"ab".repeat(32)});
const proof:GhostProof={voucherId:f.voucherId,action:"reserve",txHash:tx,logIndex:0,blockNumber:"100",blockHash:tx,blockTimestamp:"1800000000",confirmations:12,owner:f.voucher.owner,merchant:f.voucher.merchant,amountRaw:f.voucher.amountRaw,verified:true,scope:"reservationProof",voucher:f.voucher};
const route=createGhostRoute({config,read:async()=>{throw Error("unused");},prove:async(_id,_tx,action,v)=>{proves++;if(pending)throw new GhostChainError("CONFIRMATIONS_PENDING","Waiting for 12 confirmations.");if(v)assert.deepEqual(v,deserializeVoucher(f.voucher));return {...proof,action};},save:async()=>{saves++;},limit:async()=>!limited});
before(migrate);after(async()=>{await getPool().end();});
test("anonymous or wrong-owner proof writes cannot update Ghost metadata",async()=>{
 const body=JSON.stringify({voucher:f.voucher,txHash:tx});saves=0;proves=0;
 assert.equal((await route.request("/ghost/reservations/verify",{method:"POST",body})).status,401);
 const headers=await authHeaders(undefined,f.voucher.merchant);
 assert.equal((await route.request("/ghost/reservations/verify",{method:"POST",headers,body})).status,403);
 assert.equal(proves,0);assert.equal(saves,0);
});
test("signature and raw QR fields are rejected instead of being stored",async()=>{
 const headers=await authHeaders(undefined,f.voucher.owner);
 for(const extra of [{signature:f.signature},{packet:f.packet},{voucher:{...f.voucher,signature:f.signature}}]){
  const r=await route.request("/ghost/reservations/verify",{method:"POST",headers,body:JSON.stringify({voucher:f.voucher,txHash:tx,...extra})});
  assert.equal(r.status,400);
 }
});
test("matching owner proof sync, pending confirmation and rate limit remain distinct",async()=>{
 const headers=await authHeaders(undefined,f.voucher.owner);const send=()=>route.request("/ghost/reservations/verify",{method:"POST",headers,body:JSON.stringify({voucher:f.voucher,txHash:tx})});
 saves=0;pending=false;limited=false;assert.equal((await send()).status,200);assert.equal(saves,1);
 pending=true;assert.equal((await send()).status,202);assert.equal(saves,1);pending=false;
 limited=true;assert.equal((await send()).status,429);limited=false;
});
test("only the bound merchant can sync redemption proof",async()=>{
 const body=JSON.stringify({action:"redeem",txHash:tx});const path=`/ghost/vouchers/${f.voucherId}/proofs`;
 const ownerHeaders=await authHeaders(undefined,f.voucher.owner);
 assert.equal((await route.request(path,{method:"POST",headers:ownerHeaders,body})).status,403);
 const merchantHeaders=await authHeaders(undefined,f.voucher.merchant);
 assert.equal((await route.request(path,{method:"POST",headers:merchantHeaders,body})).status,200);
});
