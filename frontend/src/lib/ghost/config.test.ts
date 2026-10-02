import {test} from "node:test";
import assert from "node:assert/strict";
import {localGhostConfig} from "./config";
import {requireDeployedConfig} from "./chain";

test("disabled recovery never hides a wrong wallet or protocol chain",()=>{
  const keys=["NEXT_PUBLIC_GHOST_ENABLED","NEXT_PUBLIC_GHOST_CHAIN_ID","NEXT_PUBLIC_CHAIN_ID","NEXT_PUBLIC_GHOST_VAULT_ADDRESS","NEXT_PUBLIC_GHOST_TOKEN_ADDRESS","NEXT_PUBLIC_GHOST_DEPLOYMENT_BLOCK"] as const;
  const saved=keys.map(key=>process.env[key]);
  try {
    process.env.NEXT_PUBLIC_GHOST_ENABLED="false";
    process.env.NEXT_PUBLIC_GHOST_VAULT_ADDRESS="0x1111111111111111111111111111111111111111";
    process.env.NEXT_PUBLIC_GHOST_TOKEN_ADDRESS="0x2222222222222222222222222222222222222222";
    process.env.NEXT_PUBLIC_GHOST_DEPLOYMENT_BLOCK="1";
    for(const [protocol,wallet] of [["56","97"],["97","56"]]){
      process.env.NEXT_PUBLIC_GHOST_CHAIN_ID=protocol;process.env.NEXT_PUBLIC_CHAIN_ID=wallet;
      assert.throws(()=>requireDeployedConfig(localGhostConfig()));
    }
    process.env.NEXT_PUBLIC_GHOST_CHAIN_ID="97";process.env.NEXT_PUBLIC_CHAIN_ID="97";
    const configured=localGhostConfig();requireDeployedConfig(configured);assert.equal(configured.chainId,97);
  } finally {keys.forEach((key,i)=>{if(saved[i]===undefined)delete process.env[key];else process.env[key]=saved[i];});}
});
