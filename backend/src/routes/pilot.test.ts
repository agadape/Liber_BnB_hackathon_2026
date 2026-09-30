import {test,before,after} from "node:test";
import assert from "node:assert/strict";
import {randomUUID,createHash} from "node:crypto";
import {getPool} from "../db/pool.js";
import {migrate} from "../db/migrate.js";
import {authHeaders} from "../auth/test-helpers.js";
import {createPilotRoute} from "./pilot.js";
import {createOrder,refreshOrder,publicOrder,type Gateway,type OrderRow} from "../pilot/service.js";
import {ProviderError} from "../pilot/provider.js";
const owner="0x0000000000000000000000000000000000000123";
let creates=0,checks=0,status="pending",failCharge=false;
const response=(id:string,amount=10000)=>({order_id:id,gross_amount:amount+".00",merchant_id:"MTEST",transaction_id:"tx-"+id,payment_type:"qris",currency:"IDR",transaction_status:status,status_code:status==="pending"?"201":"200",fraud_status:"accept"});
const api:Gateway={charge:async o=>{creates++;if(failCharge)throw new ProviderError(503);return response(o.orderId,o.amountIdr);},status:async id=>{checks++;return response(id);},qr:async()=>new ArrayBuffer(1)};
before(async()=>{Object.assign(process.env,{MIDTRANS_MODE:"sandbox",PILOT_ENABLED:"true",MIDTRANS_SERVER_KEY:"test-only-key",MIDTRANS_MERCHANT_ID:"MTEST",PILOT_MERCHANT_NAME:"Test merchant",PILOT_MERCHANT_WALLET:owner});await migrate();});
after(async()=>{await getPool().query("DELETE FROM pilot_receipts WHERE order_id IN (SELECT id FROM pilot_orders WHERE owner_address=$1)",[owner]);await getPool().query("DELETE FROM pilot_orders WHERE owner_address=$1",[owner]);await getPool().end();});
const reset=()=>{creates=0;checks=0;status="pending";failCharge=false;};
test("anonymous and wrong-wallet callers cannot charge a merchant account",async()=>{
  reset();const route=createPilotRoute(api),body=JSON.stringify({amountIdr:10000});
  assert.equal((await route.request("/pilot/orders",{method:"POST",body})).status,401);
  const headers=await authHeaders(undefined,"0x0000000000000000000000000000000000000456");
  assert.equal((await route.request("/pilot/orders",{method:"POST",headers:{...headers,"Idempotency-Key":randomUUID()},body})).status,403);
  assert.equal(creates,0);
  const config=await (await route.request("/pilot/config")).text();assert.ok(!config.includes("test-only-key"));assert.ok(!config.includes("MTEST"));
});
test("concurrent retry creates one provider charge and refuses a changed amount",async()=>{
  reset();const key=randomUUID();const orders=await Promise.all([createOrder(owner,10000,key,api),createOrder(owner,10000,key,api)]);
  assert.equal(orders[0].id,orders[1].id);assert.equal(creates,1);
  await assert.rejects(()=>createOrder(owner,20000,key,api));
});
test("an unknown charge result keeps its order ID and resumes by querying the provider",async()=>{
  reset();failCharge=true;const key=randomUUID();const first=await createOrder(owner,10000,key,api);assert.equal(first.status,"creating");
  await getPool().query("UPDATE pilot_orders SET charge_claimed_at=now()-interval '1 minute' WHERE id=$1",[first.id]);failCharge=false;
  const resumed=await createOrder(owner,10000,key,api);assert.equal(resumed.id,first.id);assert.equal(resumed.status,"pending");assert.equal(creates,1);assert.equal(checks,1);
});
test("signed notification does not trust its mutable status; canonical provider data controls the receipt",async()=>{
  reset();const order=await createOrder(owner,10000,randomUUID(),api);const route=createPilotRoute(api);
  const body={...response(order.provider_order_id),transaction_status:"settlement",signature_key:createHash("sha512").update(order.provider_order_id+"201"+"10000.00"+"test-only-key").digest("hex")};
  const r=await route.request("/pilot/midtrans/notification",{method:"POST",body:JSON.stringify(body)});assert.equal(r.status,200);
  const receipts=await getPool().query("SELECT * FROM pilot_receipts WHERE order_id=$1",[order.id]);assert.equal(receipts.rowCount,0);
  assert.equal((await route.request("/pilot/midtrans/notification",{method:"POST",body:JSON.stringify({...body,signature_key:"0".repeat(128)})})).status,401);
});
test("duplicate settlement is idempotent, refund gets a new receipt, stale pending cannot restore paid",async()=>{
  reset();let order=await createOrder(owner,10000,randomUUID(),api);
  async function next(s:string){status=s;await getPool().query("UPDATE pilot_orders SET check_claimed_at=NULL WHERE id=$1",[order.id]);order=await refreshOrder(order,api);}
  await next("settlement");await next("settlement");let view=await publicOrder(order);assert.equal(view.receipts.length,1);assert.equal(view.currentlyPaid,true);
  await next("refund");await next("pending");view=await publicOrder(order);assert.equal(view.status,"refund");assert.equal(view.currentlyPaid,false);assert.equal(view.receipts.length,2);assert.notEqual(view.receipts[0].commitment,view.receipts[1].commitment);
  // Provider never returns a customer's identifying details through public serialization.
  assert.ok(!JSON.stringify(view).includes(order.provider_transaction_id!));
});
test("wrong provider amount creates no paid receipt",async()=>{
  reset();const order=await createOrder(owner,10000,randomUUID(),api);status="settlement";
  await assert.rejects(()=>refreshOrder(order,{...api,status:async id=>response(id,9999)}));
  const row=(await getPool().query<OrderRow>("SELECT * FROM pilot_orders WHERE id=$1",[order.id])).rows[0];assert.equal(row.status,"pending");
});
test("chain proof requires a provider receipt and a matching verified commitment",async()=>{
  reset();let order=await createOrder(owner,10000,randomUUID(),api);
  const txHash=`0x${"a".repeat(64)}` as const;
  let verifiedCommitment="";
  const route=createPilotRoute(api,async(commitment,hash)=>{assert.equal(hash,txHash);verifiedCommitment=commitment;return {recordedBy:owner,blockNumber:123};});
  const send=(receiptId:string,hash=txHash)=>route.request(`/pilot/orders/${order.id}/receipts/${receiptId}/proof`,{method:"POST",body:JSON.stringify({txHash:hash})});
  assert.equal((await send(randomUUID())).status,404);
  status="settlement";order=await refreshOrder(order,api);
  const view=await publicOrder(order),receipt=view.receipts[0];
  assert.equal((await send(receipt.id)).status,200);assert.equal(verifiedCommitment,receipt.commitment);
  assert.equal((await publicOrder(order)).receipts[0].txHash,txHash);
  const rejecting=createPilotRoute(api,async()=>{throw Error("Unrelated transaction");});
  const rejected=await rejecting.request(`/pilot/orders/${order.id}/receipts/${receipt.id}/proof`,{method:"POST",body:JSON.stringify({txHash:`0x${"b".repeat(64)}`})});
  assert.equal(rejected.status,409);assert.equal((await publicOrder(order)).receipts[0].txHash,txHash);
});
