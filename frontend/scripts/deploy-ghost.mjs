// Dedicated project wallet only. Never logs or copies the key into an artifact.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createPublicClient,createWalletClient,http,encodeDeployData,encodeAbiParameters,erc20Abi,keccak256,getAddress,formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
const root=new URL("../../",import.meta.url);
const manifestUrl=new URL("contracts/deployments/liber-ghost-vault.bsc-testnet.json",root);
const arg=name=>process.argv[process.argv.indexOf(name)+1];
async function main(){
 const path=arg("--wallet-state");if(!path || path.startsWith("--"))throw Error("Specify the dedicated project wallet-state path.");
 const state=JSON.parse(await readFile(path,"utf8"));const account=privateKeyToAccount(state.privateKey);
 if(getAddress(account.address)!==getAddress("0x80a92Cac1a63799170af13d17313b45EB77661e5"))throw Error("This is not the approved project deployment wallet.");
 const transport=http(process.env.BSC_TESTNET_RPC_URL||bscTestnet.rpcUrls.default.http[0],{timeout:15_000,retryCount:1});
 const rpc=createPublicClient({chain:bscTestnet,transport});
 if(await rpc.getChainId()!==97)throw Error("Wrong RPC chain.");
 const balance=await rpc.getBalance({address:account.address});
 console.log(JSON.stringify({chainId:97,deployer:account.address,balanceTestBnb:formatEther(balance)}));
 if(!process.argv.includes("--deploy"))return;
 try{await readFile(manifestUrl);throw Error("A Ghost manifest already exists. Verify it; do not deploy twice.");}catch(e){if(e.code!=="ENOENT")throw e;}
 const token="0x2116D4a3f11Aa7059Ad0911ad5C89897CC0BcC97";
 if(!await rpc.getCode({address:token}) || await rpc.readContract({address:token,abi:erc20Abi,functionName:"decimals"})!==18)throw Error("Unsupported token deployment.");
 const artifact=JSON.parse(await readFile(new URL("contracts/out/LiberGhostVault.sol/LiberGhostVault.json",root),"utf8"));
 const metadata=typeof artifact.metadata==="string"?JSON.parse(artifact.metadata):artifact.metadata;
 const args=[token];const data=encodeDeployData({abi:artifact.abi,bytecode:artifact.bytecode.object,args});
 const gas=await rpc.estimateGas({account:account.address,data});const gasPrice=await rpc.getGasPrice();
 if(gas*gasPrice>8_000_000_000_000_000n || balance<gas*gasPrice*2n)throw Error("Deployment exceeds the 0.008 TEST BNB safety cap or available balance.");
 const wallet=createWalletClient({account,chain:bscTestnet,transport});const hash=await wallet.deployContract({abi:artifact.abi,bytecode:artifact.bytecode.object,args,gas:gas*120n/100n});
 // Persist the public hash immediately so an interrupted run can be recovered without redeploying.
 await mkdir(new URL("contracts/deployments/",root),{recursive:true});
 await writeFile(manifestUrl,JSON.stringify({status:"pending",chainId:97,deployer:account.address,tokenAddress:token,txHash:hash},null,2)+"\n");
 console.log("Deployment submitted: "+hash);
 const receipt=await rpc.waitForTransactionReceipt({hash,confirmations:12,timeout:180_000});
 if(receipt.status!=="success" || !receipt.contractAddress)throw Error("Deployment not confirmed; inspect the saved hash before another action.");
 const runtime=await rpc.getCode({address:receipt.contractAddress});
 const manifest={status:"confirmed",productName:"liber:Ghost Protocol",contractName:"LiberGhostVault",chainId:97,network:"BSC Testnet",vaultAddress:getAddress(receipt.contractAddress),tokenAddress:token,tokenDecimals:18,deployer:account.address,txHash:hash,deploymentBlock:receipt.blockNumber.toString(),blockHash:receipt.blockHash,confirmationsRequired:12,domain:{name:"LiberGhost",version:"1",chainId:97,verifyingContract:getAddress(receipt.contractAddress)},compiler:metadata.compiler.version,optimizer:metadata.settings.optimizer,evmVersion:metadata.settings.evmVersion,constructorArgs:encodeAbiParameters([{type:"address"}],[token]),runtimeCodeHash:keccak256(runtime),sourceSha256:createHash("sha256").update(await readFile(new URL("contracts/src/LiberGhostVault.sol",root))).digest("hex"),artifactSha256:createHash("sha256").update(JSON.stringify(artifact)).digest("hex"),sourceVerification:"pending",confirmedAt:new Date().toISOString()};
 await writeFile(manifestUrl,JSON.stringify(manifest,null,2)+"\n");console.log(JSON.stringify(manifest,null,2));
}
main().catch(()=>{console.error("Ghost deploy/check stopped. Inspect the public manifest and saved hash; no automatic redeployment was attempted.");process.exitCode=1;});
