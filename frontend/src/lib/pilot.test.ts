import {test} from "node:test";
import assert from "node:assert/strict";
import {receiptCommitment,validPilotId,pilotStatus,type Statement} from "./pilot.js";
test("portable receipt hash ignores object key order but binds status, amount and environment",()=>{
  const s:Statement={version:1,provider:"midtrans",environment:"sandbox",orderRef:"test-order",receiptRef:"test-receipt",amountIdr:10000,currency:"IDR",status:"settlement",observedAt:"2026-09-30T12:00:00.000Z"};
  assert.equal(receiptCommitment(s),receiptCommitment(Object.fromEntries(Object.entries(s).reverse()) as unknown as Statement));
  for(const change of [{environment:"production"},{amountIdr:9000},{status:"refund"}])assert.notEqual(receiptCommitment(s),receiptCommitment({...s,...change} as Statement));
  assert.equal(pilotStatus("refund"),"Refund reported by Midtrans");assert.equal(validPilotId("not-an-invoice"),false);
});
