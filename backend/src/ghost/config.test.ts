import { test } from "node:test";
import assert from "node:assert/strict";
import { ghostConfig } from "./config.js";
const env={GHOST_ENABLED:"true",GHOST_CHAIN_ID:"97",GHOST_VAULT_ADDRESS:"0x1111111111111111111111111111111111111111",GHOST_TOKEN_ADDRESS:"0x4444444444444444444444444444444444444444",GHOST_VAULT_DEPLOYMENT_BLOCK:"100",GHOST_SERVER_HMAC_SECRET:"ab".repeat(32)};
test("Ghost fails closed without valid testnet config and never exposes its secret",()=>{
 assert.equal(ghostConfig(env).enabled,true);assert.ok(!JSON.stringify(ghostConfig(env)).includes(env.GHOST_SERVER_HMAC_SECRET));
 for(const change of [{GHOST_ENABLED:"false"},{GHOST_CHAIN_ID:"56"},{GHOST_VAULT_ADDRESS:"invalid"},{GHOST_VAULT_DEPLOYMENT_BLOCK:"-1"},{GHOST_CONFIRMATIONS:"11"},{GHOST_TOKEN_DECIMALS:"6"},{GHOST_SERVER_HMAC_SECRET:""}])
  assert.equal(ghostConfig({...env,...change}).enabled,false);
});
