import {test} from "node:test";
import assert from "node:assert/strict";
import {DEMO_QR,modelFacts,createCopilotRoute} from "./copilot.js";
import {inspectQris} from "../qris/validate.js";
test("model input excludes merchant-controlled text and raw payload",()=>{
  const serialized=JSON.stringify(modelFacts(inspectQris(DEMO_QR)));
  assert.ok(!serialized.includes("Liber Demo Coffee")); assert.ok(!serialized.includes(DEMO_QR)); assert.match(serialized,/qrisSettlementSupported/);
});
test("anonymous callers cannot explain arbitrary payloads and demo rejects arbitrary samples",async()=>{
  const route=createCopilotRoute();
  assert.equal((await route.request("/copilot/explain",{method:"POST",body:"{}"})).status,401);
  assert.equal((await route.request("/copilot/demo",{method:"POST",body:JSON.stringify({sample:"anything"})})).status,400);
  assert.equal((await route.request("/copilot/inspect",{method:"POST",body:JSON.stringify({payload:DEMO_QR.slice(0,-2)})})).status,400);
});
