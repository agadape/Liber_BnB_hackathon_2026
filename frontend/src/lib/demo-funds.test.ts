import {test} from "node:test";
import assert from "node:assert/strict";
import {DEMO_TOKEN,demoFaucetTx} from "./demo-funds";
const config={chainId:97,testnet:true,tokenAddress:DEMO_TOKEN,tokenDecimals:18};
test("demo claim targets the deployed test token and sends no native value",()=>{
  const tx=demoFaucetTx(config,97);
  assert.equal(tx.to,DEMO_TOKEN);assert.ok(!("value" in tx));
});
test("demo claim refuses mainnet and substituted token configurations",()=>{
  assert.throws(()=>demoFaucetTx(config,56));
  assert.throws(()=>demoFaucetTx({...config,chainId:56},97));
  assert.throws(()=>demoFaucetTx({...config,testnet:false},97));
  assert.throws(()=>demoFaucetTx({...config,tokenDecimals:6},97));
  assert.throws(()=>demoFaucetTx({...config,tokenAddress:null},97));
  assert.throws(()=>demoFaucetTx({...config,tokenAddress:"0x0000000000000000000000000000000000000001"},97));
});
