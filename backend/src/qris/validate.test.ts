import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectQris } from "./validate.js";
import { buildQris } from "./test-helpers.js";
const fields: Array<[string,string]> = [["00","01"],["01","12"],["53","360"],["54","25000"],["58","ID"],["59","Demo Coffee"],["60","Yogyakarta"]];
test("validated payload does not establish merchant identity or settlement", () => {
  const facts=inspectQris(buildQris(fields)); assert.equal(facts.amountIdr,"25000"); assert.equal(facts.checksumValid,true); assert.equal(facts.merchantIdentityVerified,false); assert.equal(facts.qrisSettlementSupported,false);
});
test("rejects corruption, duplicate fields, unsupported currency and missing dynamic amount", () => {
  const valid=buildQris(fields);
  for(const bad of [valid.slice(0,-1)+(valid.endsWith("0")?"1":"0"),valid.slice(0,-2),buildQris([...fields,["59","Other"]]),buildQris(fields.map(([k,v])=>[k,k==="53"?"840":v])),buildQris(fields.filter(([k])=>k!=="54"))]) assert.throws(()=>inspectQris(bad));
});
test("static input accepts an explicit amount but rejects negative and oversized values",()=>{
  const qr=buildQris(fields.filter(([k])=>k!=="54").map(([k,v])=>[k,k==="01"?"11":v]));
  assert.equal(inspectQris(qr,"10000").amountIdr,"10000"); assert.throws(()=>inspectQris(qr,"-1")); assert.throws(()=>inspectQris(qr,"10000000000000"));
  assert.throws(()=>inspectQris(qr,10000 as unknown as string));
});
