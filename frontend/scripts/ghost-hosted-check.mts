import {readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {privateKeyToAccount} from "viem/accounts";
import {challengeMessage} from "../src/lib/auth";
import type {Hex} from "viem";

// Only SIWE signatures reach the API. No Ghost authorization is read or sent.
const base=process.argv[2];const origin=process.argv[3];const localDir=resolve(process.argv[4]??"../../outputs/ghost");
if(!base?.startsWith("https://")||!origin?.startsWith("https://"))throw Error("Provide the trusted sandbox API and frontend HTTPS origins.");
if(base!=="https://liber-bnb-api-git-codex-ghost-protocol-daves-projects-3628ad99.vercel.app"||origin!=="https://liber-bnb-web-git-codex-ghost-protocol-daves-projects-3628ad99.vercel.app")throw Error("Only the project's configured Ghost sandbox origins are allowed.");
const report=JSON.parse(await readFile(resolve(localDir,"ghost-demo-e2e.json"),"utf8"));
const sessions:string[]=[];
async function request(path:string,method="GET",body?:unknown,token?:string){
  const r=await fetch(base+path,{method,headers:{Origin:origin,...(body?{"Content-Type":"application/json"}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(45_000)});
  return {status:r.status,allowOrigin:r.headers.get("access-control-allow-origin"),data:await r.json()};
}
function check(ok:unknown,label:string){if(!ok)throw Error("Hosted check failed: "+label);}
async function login(file:string,expected:string){
  const state=JSON.parse(await readFile(resolve(localDir,file),"utf8"));const account=privateKeyToAccount(state.privateKey as Hex);
  check(account.address===expected,"local account identity");
  const challenge=await request("/auth/challenge","POST",{walletAddress:account.address});check(challenge.status===200,"SIWE challenge");const c=challenge.data;
  check(c.uri===origin&&c.domain===new URL(origin).host&&c.chainId===97,"SIWE domain and chain");
  const message=challengeMessage(c,account.address,origin);
  const signed=await account.signMessage({message});const verified=await request("/auth/verify","POST",{nonce:c.nonce,signature:signed});
  check(verified.status===200&&verified.data.walletAddress===account.address,"SIWE session");sessions.push(verified.data.token);return verified.data.token as string;
}
const result={scope:"BSC Testnet / hosted sandbox metadata only",checkedAt:new Date().toISOString(),api:base,origin,checks:{} as Record<string,boolean>};
try {
  const config=await request("/ghost/config");check(config.status===200&&config.data.enabled&&config.data.chainId===97&&config.data.vaultAddress===report.vault,"deployment configuration");result.checks.config=true;
  check(config.allowOrigin===origin,"CORS origin");result.checks.cors=true;
  const unauthorized=await request("/ghost/me/vouchers");check(unauthorized.status===401,"private endpoint requires SIWE");result.checks.authenticationRequired=true;
  const owner=await login(".owner-wallet.json",report.owner);const merchant=await login(".merchant-wallet.json",report.merchant);result.checks.siwe=true;
  const wrong=await request("/ghost/reservations/verify","POST",{voucher:report.vouchers.payment,txHash:report.transactions.reserve_payment},merchant);check(wrong.status===403,"wrong owner rejected");result.checks.ownerIsolation=true;
  for(const name of ["payment","expiry"]){
    const body={voucher:report.vouchers[name],txHash:report.transactions["reserve_"+name]};
    const saved=await Promise.all([request("/ghost/reservations/verify","POST",body,owner),request("/ghost/reservations/verify","POST",body,owner)]);
    saved.forEach(r=>check(r.status===200&&r.data.verified,"concurrent canonical reservation sync"));
  }
  result.checks.idempotentConcurrentSync=true;
  const malformed=await request("/ghost/reservations/verify","POST",{voucher:report.vouchers.payment,txHash:report.transactions.reserve_payment,signature:"forbidden"},owner);check(malformed.status===400,"Ghost signature fields forbidden");result.checks.capabilityFieldsRejected=true;
  for(const [name,action,token] of [["payment","redeem",merchant],["expiry","reclaim",owner]]){
    const id=report.proofs["reserve_"+name].voucherId;const sync=await request(`/ghost/vouchers/${id}/proofs`,"POST",{action,txHash:report.transactions[action]},token);check(sync.status===200&&sync.data.verified,"terminal proof sync");
    const publicRead=await request(`/ghost/vouchers/${id}`);check(publicRead.status===200&&publicRead.data.proofs.some((p:{action:string;verified:boolean})=>p.action===action&&p.verified),"public proof reverified");
    result.checks[action+"PublicProof"]=true;
  }
  const history=await request("/ghost/me/vouchers","GET",undefined,owner);check(history.status===200&&history.data.items.length>=2,"owner verified history");result.checks.ownerHistory=true;
  const recovered=await request("/ghost/me/recover","POST",{},owner);
  console.log(JSON.stringify({recoveryStatus:recovered.status,code:recovered.data.code,error:recovered.data.error,itemCount:recovered.data.items?.length}));
  check(recovered.status===200&&Array.isArray(recovered.data.items)&&recovered.data.items.length<=5,"bounded owner recovery");
  check(recovered.data.items.every((p:{owner:string;verified:boolean;confirmations:number})=>p.owner===report.owner&&p.verified&&p.confirmations>=12),"recovered owner canonical proofs");result.checks.boundedOwnerRecovery=true;
  if(recovered.data.next){const foreign=await request("/ghost/me/recover","POST",{cursor:recovered.data.next},merchant);check(foreign.status===400,"recovery cursor owner binding");result.checks.recoveryCursorIsolation=true;}
  await writeFile(resolve(localDir,"ghost-hosted-check.json"),JSON.stringify(result,null,2)+"\n");console.log(JSON.stringify(result,null,2));
} finally {for(const token of sessions)await request("/auth/logout","POST",undefined,token).catch(()=>{});}
