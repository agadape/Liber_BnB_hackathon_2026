// Actual TESTNET evidence. Separate processes; physical phone-off evidence is recorded separately.
import {readFile,writeFile,mkdir,unlink} from "node:fs/promises";
import {randomBytes} from "node:crypto";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";
import QRCode from "qrcode";
import {createWalletClient,http,erc20Abi,getAddress,type Hash,type Hex,type Address} from "viem";
import {generatePrivateKey,privateKeyToAccount} from "viem/accounts";
import {bscTestnet} from "viem/chains";
import {ghostAbi} from "../src/lib/ghost/ghost-abi";
import {ghostRpc} from "../src/lib/ghost/config";
import {assertGhostDeployment,freshHead,readGhostState,verifyGhostProof,type ReadyGhostConfig} from "../src/lib/ghost/chain";
import {voucherTypedData,voucherId,encodePacket,decodePacket,deserializeVoucher,serializeVoucher} from "../src/lib/ghost/codec";
const root=new URL("../../",import.meta.url),out=new URL("../../../outputs/ghost/",import.meta.url);
const manifest=JSON.parse(await readFile(new URL("contracts/deployments/liber-ghost-vault.bsc-testnet.json",root),"utf8"));
const config:ReadyGhostConfig={enabled:true,chainId:97,vaultAddress:manifest.vaultAddress,tokenAddress:manifest.tokenAddress,tokenDecimals:18,deploymentBlock:manifest.deploymentBlock,confirmationsRequired:12,tokenLabel:"MockUSDC",testnet:true,reason:null};
const rpc=ghostRpc(),transport=http(process.env.BSC_TESTNET_RPC_URL||bscTestnet.rpcUrls.default.http[0]);
const reportUrl=new URL("ghost-demo-e2e.json",out);
type Report={scope:string;vault:Address;owner:Address;merchant:Address;transactions:Record<string,Hash>;vouchers:Record<string,ReturnType<typeof serializeVoucher>>;proofs:Record<string,unknown>;checks:Record<string,boolean>;physicalPhoneOffTest:string};
let report:Report;
async function save(){await writeFile(reportUrl,JSON.stringify(report,null,2)+"\n");}
async function key(role:string){return privateKeyToAccount(JSON.parse(await readFile(new URL(`.${role}-wallet.json`,out),"utf8")).privateKey as Hex);}
async function mined(name:string,send:()=>Promise<Hash>,confirmations=12){let hash=report.transactions[name];if(!hash){hash=await send();report.transactions[name]=hash;await save();console.log(name+": "+hash);}const receipt=await rpc.waitForTransactionReceipt({hash,confirmations,timeout:120_000});assert.equal(receipt.status,"success");return hash;}
async function main(){
 await mkdir(out,{recursive:true});await assertGhostDeployment(rpc,config);
 try{report=JSON.parse(await readFile(reportUrl,"utf8"));assert.equal(report.vault,config.vaultAddress);}catch(e){if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;
  const ownerKey=generatePrivateKey(),merchantKey=generatePrivateKey();
  await writeFile(new URL(".owner-wallet.json",out),JSON.stringify({privateKey:ownerKey}),{mode:0o600});await writeFile(new URL(".merchant-wallet.json",out),JSON.stringify({privateKey:merchantKey}),{mode:0o600});
  report={scope:"BSC Testnet / MockUSDC only",vault:config.vaultAddress,owner:privateKeyToAccount(ownerKey).address,merchant:privateKeyToAccount(merchantKey).address,transactions:{},vouchers:{},proofs:{},checks:{},physicalPhoneOffTest:"not performed; separate buyer and merchant processes only"};await save();
 }
 const stage=process.argv[2];
 if(stage==="prepare"){
  const walletPath=process.argv[3];if(!walletPath)throw Error("Dedicated deployment wallet path required for test gas.");
  const deployer=privateKeyToAccount(JSON.parse(await readFile(walletPath,"utf8")).privateKey as Hex);assert.equal(getAddress(deployer.address),getAddress("0x80a92Cac1a63799170af13d17313b45EB77661e5"));
  const funding=createWalletClient({account:deployer,chain:bscTestnet,transport});
  for(const [name,address] of [["owner",report.owner],["merchant",report.merchant]] as const){const balance=await rpc.getBalance({address});if(balance<500_000_000_000_000n)await mined("gas_"+name,()=>funding.sendTransaction({to:address,value:1_000_000_000_000_000n-balance}),2);}
  const owner=await key("owner"),wallet=createWalletClient({account:owner,chain:bscTestnet,transport});
  await mined("faucet",()=>wallet.writeContract({address:config.tokenAddress,abi:[{type:"function",name:"faucet",inputs:[],outputs:[],stateMutability:"nonpayable"}],functionName:"faucet"}),2);
  await mined("approval",()=>wallet.writeContract({address:config.tokenAddress,abi:erc20Abi,functionName:"approve",args:[config.vaultAddress,7n*10n**18n]}),2);
  for(const [name,amount,duration] of [["payment",5n*10n**18n,3600],["expiry",2n*10n**18n,360]] as const){
   if(!report.vouchers[name]){const head=await freshHead(rpc);report.vouchers[name]=serializeVoucher({owner:owner.address,merchant:report.merchant,amount,validBefore:head.timestamp+BigInt(duration),salt:("0x"+randomBytes(32).toString("hex")) as Hash});await save();}
   const v=deserializeVoucher(report.vouchers[name]);
   if(name==="payment"){
    const signature=await owner.signTypedData(voucherTypedData(config.vaultAddress,v));const packet=encodePacket(config.vaultAddress,v,signature);
    await writeFile(new URL(".handover-packet.txt",out),packet,{mode:0o600});await QRCode.toFile(fileURLToPath(new URL("ghost-paper-qr.png",out)),packet,{width:1200,margin:4,errorCorrectionLevel:"H"});
   }
   await mined("reserve_"+name,()=>wallet.writeContract({address:config.vaultAddress,abi:ghostAbi,functionName:"reserve",args:[v]}));
   report.proofs["reserve_"+name]=await verifyGhostProof(rpc,config,voucherId(config.vaultAddress,v),report.transactions["reserve_"+name],"reserve",v);await save();
  }
  const expiry=deserializeVoucher(report.vouchers.expiry);const head=await freshHead(rpc);
  if(head.timestamp<expiry.validBefore){await assert.rejects(()=>rpc.simulateContract({address:config.vaultAddress,abi:ghostAbi,functionName:"reclaim",args:[voucherId(config.vaultAddress,expiry)],account:owner.address}));report.checks.earlyReclaimRejected=true;await save();}
  console.log("Buyer preparation complete. Close this process; redemption requires only the merchant key and QR.");
 }else if(stage==="redeem"){
  // This branch never reads the buyer or deployer wallet keys.
  if(report.proofs.redeem){console.log("Redemption already proved; no new transaction or balance comparison attempted.");return;}
  const merchant=await key("merchant"),wallet=createWalletClient({account:merchant,chain:bscTestnet,transport});
  const packet=await decodePacket(await readFile(new URL(".handover-packet.txt",out),"utf8"),config.vaultAddress);
  const before=await rpc.readContract({address:config.tokenAddress,abi:erc20Abi,functionName:"balanceOf",args:[merchant.address]});
  if(!report.transactions.redeem){await assert.rejects(()=>rpc.simulateContract({address:config.vaultAddress,abi:ghostAbi,functionName:"redeem",args:[packet.voucher,packet.signature],account:report.owner}));report.checks.wrongMerchantRejected=true;await save();await rpc.simulateContract({address:config.vaultAddress,abi:ghostAbi,functionName:"redeem",args:[packet.voucher,packet.signature],account:merchant.address});}
  await mined("redeem",()=>wallet.writeContract({address:config.vaultAddress,abi:ghostAbi,functionName:"redeem",args:[packet.voucher,packet.signature]}));
  const proof=await verifyGhostProof(rpc,config,packet.id,report.transactions.redeem,"redeem");report.proofs.redeem=proof;
  const after=await rpc.readContract({address:config.tokenAddress,abi:erc20Abi,functionName:"balanceOf",args:[merchant.address]});report.checks.exactMerchantTransfer=after-before===packet.voucher.amount;
  await assert.rejects(()=>rpc.simulateContract({address:config.vaultAddress,abi:ghostAbi,functionName:"redeem",args:[packet.voucher,packet.signature],account:merchant.address}));report.checks.replayRejected=true;
  await save();await unlink(new URL(".handover-packet.txt",out));console.log("Payment and replay proof saved. No buyer signature request or buyer transaction occurred during redemption.");
 }else if(stage==="reclaim"){
  const owner=await key("owner"),wallet=createWalletClient({account:owner,chain:bscTestnet,transport});const v=deserializeVoucher(report.vouchers.expiry),id=voucherId(config.vaultAddress,v);
  const state=await readGhostState(rpc,config,id);if(state.effectiveStatus!=="expired_reclaimable"&&!report.transactions.reclaim){console.log("Not yet expired. Reclaim available at "+v.validBefore);return;}
  await mined("reclaim",()=>wallet.writeContract({address:config.vaultAddress,abi:ghostAbi,functionName:"reclaim",args:[id]}));report.proofs.reclaim=await verifyGhostProof(rpc,config,id,report.transactions.reclaim,"reclaim");report.checks.expiredOwnerReclaim=true;
  assert.equal((await readGhostState(rpc,config,id)).effectiveStatus,"reclaimed");await save();console.log("Expiry reclaim and exact owner transfer proved.");
 }else throw Error("Choose prepare, redeem or reclaim.");
}
main().catch(()=>{console.error("Testnet E2E stopped. Inspect saved public transaction hashes; no automatic resend was attempted.");process.exitCode=1;});
