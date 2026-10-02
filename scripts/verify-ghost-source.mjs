// Source verification uses public artifacts only. API: https://docs.sourcify.dev/docs/api/
import {readFile,writeFile} from "node:fs/promises";
const root=new URL("../",import.meta.url),file=new URL("contracts/deployments/liber-ghost-vault.bsc-testnet.json",root);
const manifest=JSON.parse(await readFile(file,"utf8"));
let job=manifest.sourceVerificationJob;
if(!job){
 const input=JSON.parse(await readFile(new URL("contracts/verification/LiberGhostVault.standard-input.json",root),"utf8"));
 const r=await fetch(`https://sourcify.dev/server/v2/verify/97/${manifest.vaultAddress}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({stdJsonInput:input,compilerVersion:manifest.compiler,contractIdentifier:"src/LiberGhostVault.sol:LiberGhostVault",creationTransactionHash:manifest.txHash}),signal:AbortSignal.timeout(55_000)});
 const result=await r.json();console.log(JSON.stringify({status:r.status,...result}));
 if(result.verificationId){job=result.verificationId;manifest.sourceVerificationJob=job;await writeFile(file,JSON.stringify(manifest,null,2)+"\n");}
}
if(job){const r=await fetch(`https://sourcify.dev/server/v2/verify/${job}`,{signal:AbortSignal.timeout(20_000)});const result=await r.json();console.log(JSON.stringify(result));
 await writeFile(new URL("contracts/verification/LiberGhostVault.sourcify-result.json",root),JSON.stringify(result,null,2)+"\n");
 if(result.isJobCompleted && result.contract?.runtimeMatch && result.contract?.creationMatch){manifest.sourceVerification="verified on Sourcify";manifest.sourceVerificationUrl=`https://repo.sourcify.dev/97/${manifest.vaultAddress}`;await writeFile(file,JSON.stringify(manifest,null,2)+"\n");}}
