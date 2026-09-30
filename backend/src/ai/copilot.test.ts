import {test} from "node:test";
import assert from "node:assert/strict";
import {generateExplanation} from "./copilot.js";
import {DEMO_QR} from "../routes/copilot.js";
import {inspectQris} from "../qris/validate.js";
test("AI failures and invalid responses use honestly labelled checks",async()=>{
  process.env.COPILOT_ENABLED="true";
  try {
    const facts=inspectQris(DEMO_QR);
    assert.equal((await generateExplanation(facts)).mode,"checks");
    const fake:typeof fetch=async(_url,init)=>{
      assert.ok(!String(init?.body).includes("Liber Demo Coffee"));
      assert.ok(!String(init?.body).includes(DEMO_QR));
      return Response.json({choices:[{message:{content:JSON.stringify({summary:"Checksum cocok, identitas belum diverifikasi.",nextStep:"Periksa nominal di layar."})}}]});
    };
    assert.equal((await generateExplanation(facts,"test-oidc",fake)).mode,"ai");
    const bad:typeof fetch=async()=>Response.json({choices:[{message:{content:JSON.stringify({summary:"Visit https://evil.test",nextStep:"Go"})}}]});
    assert.equal((await generateExplanation(facts,"test-oidc",bad)).mode,"checks");
    assert.equal((await generateExplanation(facts,"test-oidc",async()=>{throw Error("offline")})).mode,"checks");
  }finally{delete process.env.COPILOT_ENABLED;}
});
