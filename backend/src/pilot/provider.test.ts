import {test} from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {Midtrans,checkedStatus,validSignature,pilotConfig,acceptsStatus} from "./provider.js";
const order={orderId:"lp-s-test",amountIdr:10000,transactionId:"test-tx"};
const data={order_id:order.orderId,gross_amount:"10000.00",merchant_id:"MTEST",transaction_id:"test-tx",payment_type:"qris",currency:"IDR",transaction_status:"settlement",status_code:"200",fraud_status:"accept"};
test("provider acceptance binds amount, merchant, order, method, currency and transaction",()=>{
  assert.equal(checkedStatus(data,order,"MTEST","sandbox").status,"settlement");
  for(const changed of [{gross_amount:"9999.00"},{gross_amount:"1e4"},{merchant_id:"OTHER"},{order_id:"other"},{currency:"USD"},{payment_type:"credit_card"},{transaction_id:"other"},{fraud_status:"challenge"},{status_code:"201"},{transaction_status:"capture"}])assert.throws(()=>checkedStatus({...data,...changed},order,"MTEST","sandbox"));
  assert.equal(acceptsStatus("settlement","pending"),false);assert.equal(acceptsStatus("refund","settlement"),false);assert.equal(acceptsStatus("partial_refund","refund"),true);
});
test("signature is timing-safe and notification status must still be verified independently",()=>{
  const key="test-only-key",body={...data,signature_key:createHash("sha512").update(data.order_id+data.status_code+data.gross_amount+key).digest("hex")};
  assert.equal(validSignature(body,key),true);assert.equal(validSignature({...body,gross_amount:"9000.00"},key),false);assert.equal(validSignature({...body,signature_key:"x"},key),false);
  assert.equal(validSignature({...body,transaction_status:"refund"},key),true); // Status is NOT part of Midtrans's signature.
});
test("credentials are sent only to the selected official host; requests exclude customer data",async()=>{
  const calls:Array<{url:string;init:RequestInit}>=[];
  const fetcher=(async(input:unknown,init:RequestInit)=>{calls.push({url:String(input),init});return new Response(JSON.stringify({...data,status_code:"201",transaction_status:"pending"}),{status:200});}) as typeof fetch;
  await new Midtrans("sandbox","test-only-key",fetcher).charge(order);
  assert.equal(calls[0].url,"https://api.sandbox.midtrans.com/v2/charge");assert.equal(calls[0].init.redirect,"error");
  assert.deepEqual(JSON.parse(calls[0].init.body as string),{payment_type:"qris",transaction_details:{order_id:order.orderId,gross_amount:10000},qris:{acquirer:"gopay"}});
});
test("production requires an explicit live gate in addition to merchant configuration",()=>{
  Object.assign(process.env,{MIDTRANS_MODE:"production",PILOT_ENABLED:"true",MIDTRANS_SERVER_KEY:"test-only-key",MIDTRANS_MERCHANT_ID:"MTEST",PILOT_MERCHANT_NAME:"Test merchant",PILOT_MERCHANT_WALLET:"0x0000000000000000000000000000000000000123"});
  delete process.env.MIDTRANS_LIVE_CONFIRMED;assert.equal(pilotConfig().ready,false);
  process.env.MIDTRANS_LIVE_CONFIRMED="true";assert.equal(pilotConfig().ready,true);
});
