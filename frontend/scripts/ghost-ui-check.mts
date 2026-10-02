// Recheck public receipts from the recorded hosted UI run. No wallet keys or QR are read.
import {readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
import {ghostRpc} from "../src/lib/ghost/config";
import {verifyGhostProof,readGhostState,type ReadyGhostConfig} from "../src/lib/ghost/chain";
import type {Hash} from "viem";
const manifest=JSON.parse(await readFile(resolve("../contracts/deployments/liber-ghost-vault.bsc-testnet.json"),"utf8"));
const config:ReadyGhostConfig={enabled:true,chainId:97,vaultAddress:manifest.vaultAddress,tokenAddress:manifest.tokenAddress,tokenDecimals:18,deploymentBlock:manifest.deploymentBlock,confirmationsRequired:12,tokenLabel:"MockUSDC",testnet:true,reason:null};
const id:Hash="0xea0ade9bb3b58bcb01854d3a1ec93f13b86f6a6718ae41cae806bbe957bae860";
const transactions={reserve:"0xacceb4dd859f8b11616e37f323e9637b00caa4488b65035a95664ec35630e9bd",redeem:"0xc6671085ab00f55cc9a4cdf231060343a785ae917c82302c444b6cdfc3abb91b"} as const;
const rpc=ghostRpc();
const reserve=await verifyGhostProof(rpc,config,id,transactions.reserve,"reserve");
const redeem=await verifyGhostProof(rpc,config,id,transactions.redeem,"redeem");
const state=await readGhostState(rpc,config,id);
assert.equal(state.effectiveStatus,"redeemed");assert.equal(redeem.amountRaw,"5000000000000000000");
assert.equal(redeem.owner,"0xde6fBA63bBcD1F2E81a2c498b7880EEbf12Faf64");assert.equal(redeem.merchant,"0x6EAdd91fc2FAc8c7110ADac362982FE881A3f1E1");
const report={scope:"BSC Testnet / hosted browser UI / no cash value",checkedAt:new Date().toISOString(),vault:config.vaultAddress,token:config.tokenAddress,voucherId:id,transactions,proofs:{reserve,redeem},state,
  uiObservations:{method:"Observed through browser controls; chain receipts independently rechecked by this script",wallets:"Separate browser origins using device test wallets; browser private keys never extracted",buyerPageClosedBeforeRedeem:true,fundedQrDisplayed:true,ownerReservationHistorySynced:true,merchantLocalPngDecoded:true,paymentConfirmedDisplayed:true,samePngRescan:"Already redeemed. No new transaction will be sent."},
  pending:["Physical paper print and scan","Actual buyer phone-off footage","Save QR download button and print dialog verification","Injected MetaMask / real mobile device checks"],
  metadataSync:"Owner reservation synced through SIWE. This run used a second frontend origin for the merchant; its terminal API sync was not attempted. See ghost-hosted-check.json for separately verified authenticated terminal proof sync."};
await writeFile(resolve("../../outputs/ghost/ghost-ui-e2e.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({voucherId:id,transactions,amountRaw:redeem.amountRaw,confirmations:redeem.confirmations,state:state.effectiveStatus},null,2));
