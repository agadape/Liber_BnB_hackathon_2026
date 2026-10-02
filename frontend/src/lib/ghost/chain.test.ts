import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { encodeAbiParameters, encodeEventTopics, erc20Abi, type Hash, type PublicClient } from "viem";
import { ghostAbi } from "./ghost-abi";
import { deserializeVoucher } from "./codec";
import { verifyGhostProof, freshHead, effectiveStatus, assertGhostDeployment, readGhostState, requireReadyConfig, type ReadyGhostConfig } from "./chain";
const f = JSON.parse(readFileSync(new URL("../../../../protocol/fixtures/ghost-v1-golden.json", import.meta.url),"utf8"));
const v = deserializeVoucher(f.voucher);
const token = "0x4444444444444444444444444444444444444444" as const;
const h = (digit: string) => "0x"+digit.repeat(64) as Hash;
const config:ReadyGhostConfig={enabled:true,chainId:97,vaultAddress:f.vault,tokenAddress:token,tokenDecimals:18,deploymentBlock:"1",confirmationsRequired:12,tokenLabel:"MockUSDC",testnet:true,reason:null};
function setup() {
 const now=BigInt(Math.floor(Date.now()/1000));
 const event={address:f.vault,data:encodeAbiParameters([{type:"uint256"}],[v.amount]),topics:encodeEventTopics({abi:ghostAbi,eventName:"VoucherRedeemed",args:{voucherId:f.voucherId,owner:v.owner,merchant:v.merchant}}),logIndex:1};
 const transfer={address:token,data:encodeAbiParameters([{type:"uint256"}],[v.amount]),topics:encodeEventTopics({abi:erc20Abi,eventName:"Transfer",args:{from:f.vault,to:v.merchant}}),logIndex:0};
 const receipt={status:"success",to:f.vault,from:v.merchant,blockNumber:100n,blockHash:h("a"),logs:[transfer,event]};
 const state={head:111n,chain:97,domain:["0x0f","LiberGhost","1",97n,f.vault,h("0"),[]],now,receipt};
 const client={getChainId:async()=>state.chain,getCode:async()=>"0x1234",readContract:async({functionName}:{functionName:string})=>functionName==="token"?token:functionName==="decimals"?18:functionName==="eip712Domain"?state.domain:[v.owner,v.merchant,v.amount,v.validBefore,2],getBlock:async({blockNumber}:{blockNumber?:bigint})=>({hash:blockNumber===100n?h("a"):h("b"),number:blockNumber??state.head,timestamp:state.now}),getTransactionReceipt:async()=>state.receipt} as unknown as PublicClient;
 return {state,client,event,transfer};
}
test("verified redemption requires canonical receipt, exact event and exact ERC20 transfer",async()=>{
 const {client}=setup();const p=await verifyGhostProof(client,config,f.voucherId,h("c"),"redeem");
 assert.equal(p.verified,true);assert.equal(p.confirmations,12);assert.equal(p.amountRaw,v.amount.toString());assert.equal(p.scope,"redemptionProof");
});
test("forged event sources, missing transfers, wrong amount/recipient and reverted transactions never prove payment",async()=>{
 for(const mutation of ["noTransfer","wrongToken","wrongAmount","wrongRecipient","wrongVault","wrongCaller","reverted","reorg"]){
  const {client,state,event,transfer}=setup();
  if(mutation==="noTransfer")state.receipt.logs=[event];
  if(mutation==="wrongToken")transfer.address=f.vault;
  if(mutation==="wrongAmount")transfer.data=encodeAbiParameters([{type:"uint256"}],[v.amount+1n]);
  if(mutation==="wrongRecipient")transfer.topics=encodeEventTopics({abi:erc20Abi,eventName:"Transfer",args:{from:f.vault,to:v.owner}});
  if(mutation==="wrongVault")event.address=token;
  if(mutation==="wrongCaller")state.receipt.from=v.owner;
  if(mutation==="reverted")state.receipt.status="reverted";
  if(mutation==="reorg")state.receipt.blockHash=h("d");
  await assert.rejects(()=>verifyGhostProof(client,config,f.voucherId,h("c"),"redeem"),/match|prove|canonical/);
 }
});
test("under-confirmed and stale chain reads remain unverified",async()=>{
 const {client,state}=setup();state.head=110n;
 await assert.rejects(()=>verifyGhostProof(client,config,f.voucherId,h("c"),"redeem"),/12 confirmations/);
 state.now-=16n;await assert.rejects(()=>freshHead(client),/Chain time/);
});
test("deployment identity rejects wrong network or signing domain",async()=>{
 const {client,state}=setup();state.chain=56;await assert.rejects(()=>assertGhostDeployment(client,config));state.chain=97;state.domain[1]="liber:Ghost Protocol";
 await assert.rejects(()=>assertGhostDeployment(client,config));
});
test("exact expiry partitions redeemable and reclaimable states",()=>{
 assert.equal(effectiveStatus(1,100n,99n),"reserved");assert.equal(effectiveStatus(1,100n,100n),"expired_reclaimable");assert.equal(effectiveStatus(2,100n,101n),"redeemed");assert.equal(effectiveStatus(3,100n,101n),"reclaimed");
});
test("disabling issuance preserves deployment verification and existing voucher recovery",async()=>{
 const disabled={...config,enabled:false,reason:"Issuance disabled"};const {client}=setup();
 assert.throws(()=>requireReadyConfig(disabled));
 assert.equal((await readGhostState(client,disabled,f.voucherId)).effectiveStatus,"redeemed");
 assert.equal((await verifyGhostProof(client,disabled,f.voucherId,h("c"),"redeem")).verified,true);
});
