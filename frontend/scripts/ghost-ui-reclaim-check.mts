// Recheck public receipts from the hosted UI expiry/reclaim run; no wallet or QR is read.
import {readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
import {ghostRpc} from "../src/lib/ghost/config";
import {verifyGhostProof,readGhostState,type ReadyGhostConfig} from "../src/lib/ghost/chain";
import type {Hash} from "viem";

const manifest=JSON.parse(await readFile(resolve("../contracts/deployments/liber-ghost-vault.bsc-testnet.json"),"utf8"));
const config:ReadyGhostConfig={enabled:true,chainId:97,vaultAddress:manifest.vaultAddress,tokenAddress:manifest.tokenAddress,tokenDecimals:18,deploymentBlock:manifest.deploymentBlock,confirmationsRequired:12,tokenLabel:"MockUSDC",testnet:true,reason:null};
const id:Hash="0xed6b4758b563425e225d5d28afa34c32f170b930751da2ddb865a7ec954339f7";
const transactions={reserve:"0x0ba004c3a7beb4f5887c7e08d40cb6097a0a20fe1ccdd00dd384ee4f86f8f5ed",reclaim:"0xb01b1f547092fcb98cd3469869a6ee1675a7c7d67f8653133028e44abf57d439"} as const;
const rpc=ghostRpc();
const reserve=await verifyGhostProof(rpc,config,id,transactions.reserve,"reserve");
const reclaim=await verifyGhostProof(rpc,config,id,transactions.reclaim,"reclaim");
const state=await readGhostState(rpc,config,id);
assert.equal(state.effectiveStatus,"reclaimed");
assert.equal(reclaim.amountRaw,"1000000000000000000");
assert.equal(reclaim.owner,"0xde6fBA63bBcD1F2E81a2c498b7880EEbf12Faf64");
assert.equal(reclaim.merchant,"0x6EAdd91fc2FAc8c7110ADac362982FE881A3f1E1");
assert.ok(reserve.voucher);
assert.ok(BigInt(reclaim.blockTimestamp)>=BigInt(reserve.voucher.validBefore));
const report={scope:"BSC Testnet / public receipts from hosted UI expiry and reclaim / no cash value",checkedAt:new Date().toISOString(),vault:config.vaultAddress,token:config.tokenAddress,voucherId:id,transactions,proofs:{reserve,reclaim},state,evidenceBoundary:"The browser displayed funded QR, disabled new export near expiry, and confirmed the owner reclaim. This script independently checks public chain evidence only; it does not prove a saved PNG, physical print, buyer phone-off or a real mobile device."};
await writeFile(resolve("../../outputs/ghost/ghost-ui-reclaim.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({voucherId:id,transactions,amountRaw:reclaim.amountRaw,confirmations:reclaim.confirmations,state:state.effectiveStatus},null,2));
