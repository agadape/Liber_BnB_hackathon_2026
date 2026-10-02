import {Hono} from "hono";
import {bodyLimit} from "hono/body-limit";
import {getAddress,type Hash} from "viem";
import {requireWallet,type AuthEnv} from "../auth/auth.js";
import {ghostConfig} from "../ghost/config.js";
import {GhostChainError,requireDeployedConfig,verifyGhostProof,type GhostAction} from "../ghost/chain.js";
import {hashPattern,deserializeVoucher,voucherId,validateVoucher,type GhostVoucher} from "../ghost/codec.js";
import {getGhost,proveGhost,saveGhostProof,ghostRpc} from "../ghost/service.js";
import {ghostLimit,decodeCursor,encodeCursor,type RecoveryCursor} from "../ghost/limits.js";
import {ghostAbi} from "../ghost/ghost-abi.js";
import {getPool} from "../db/pool.js";
import {recoveryPage} from "../ghost/recovery.js";
import type {Context} from "hono";
function failure(c:Context,e:unknown) {
  if(e instanceof GhostChainError) {
    const status=e.code==="CONFIRMATIONS_PENDING"?202:e.code==="UNKNOWN_VOUCHER"?404:e.code==="MALFORMED_INPUT"?400:["GHOST_DISABLED","RPC_UNAVAILABLE","CONFIG_MISMATCH"].includes(e.code)?503:409;
    return c.json({error:e.message,code:e.code},status);
  }
  return c.json({error:"Ghost could not be checked. Retry verification without sending another transaction.",code:"RPC_UNAVAILABLE"},503);
}
export function createGhostRoute(deps={config:ghostConfig,read:getGhost,prove:proveGhost,save:saveGhostProof,limit:ghostLimit}) {
  const route=new Hono<AuthEnv>();
  route.use("/ghost/*",bodyLimit({maxSize:4096}));
  route.use("/ghost/*",async(c,next)=>{c.header("Cache-Control","no-store");await next();});
  route.get("/ghost/config",c=>c.json(deps.config()));
  route.get("/ghost/vouchers/:id",async c=>{
    const id=c.req.param("id");if(!hashPattern.test(id))return c.json({error:"Invalid voucher ID",code:"MALFORMED_INPUT"},400);
    try {
      requireDeployedConfig(deps.config());
      // Only Vercel's overwritten single-client header is trusted; local requests share a bucket.
      const ip=process.env.VERCEL==="1"?(c.req.header("x-vercel-forwarded-for")??"unknown").split(",")[0].trim():"local";
      if(!await deps.limit("public_read",ip)){c.header("Retry-After","60");return c.json({error:"Too many verification requests.",code:"RATE_LIMITED"},429);}
      return c.json(await deps.read(id.toLowerCase() as Hash));
    }catch(e){return failure(c,e);}
  });
  route.use("/ghost/me/*",requireWallet);
  route.use("/ghost/reservations/verify",requireWallet);
  route.use("/ghost/vouchers/:id/proofs",requireWallet);
  route.post("/ghost/reservations/verify",async c=>{
    const body=await c.req.json().catch(()=>null);
    if(!body || Object.keys(body).sort().join(",")!=="txHash,voucher" || !hashPattern.test(body.txHash??""))return c.json({error:"Malformed reservation proof",code:"MALFORMED_INPUT"},400);
    let v:GhostVoucher;
    try{v=deserializeVoucher(body.voucher);}catch{return c.json({error:"Malformed voucher fields",code:"MALFORMED_INPUT"},400);}
    try {
      const config=deps.config();requireDeployedConfig(config);
      try{validateVoucher(v,config.vaultAddress);}catch{return c.json({error:"Invalid voucher fields",code:"MALFORMED_INPUT"},400);}
      if(getAddress(c.get("walletAddress"))!==v.owner)return c.json({error:"This reservation belongs to another wallet",code:"OWNER_MISMATCH"},403);
      if(!await deps.limit("private_proof",v.owner))return c.json({error:"Try again in a minute",code:"RATE_LIMITED"},429);
      const proof=await deps.prove(voucherId(config.vaultAddress,v),body.txHash.toLowerCase(),"reserve",v);await deps.save(proof);return c.json(proof);
    }catch(e){return failure(c,e);}
  });
  route.post("/ghost/vouchers/:id/proofs",async c=>{
    const id=c.req.param("id"),body=await c.req.json().catch(()=>null);
    if(!hashPattern.test(id) || !body || Object.keys(body).sort().join(",")!=="action,txHash" || !hashPattern.test(body.txHash??"") || !["redeem","reclaim"].includes(body.action))return c.json({error:"Malformed terminal proof",code:"MALFORMED_INPUT"},400);
    try {
      requireDeployedConfig(deps.config());const wallet=c.get("walletAddress");
      if(!await deps.limit("private_proof",wallet))return c.json({error:"Try again in a minute",code:"RATE_LIMITED"},429);
      const proof=await deps.prove(id.toLowerCase() as Hash,body.txHash.toLowerCase(),body.action as GhostAction);
      const expected=body.action==="redeem"?proof.merchant:proof.owner;
      if(getAddress(wallet)!==getAddress(expected))return c.json({error:"Proof belongs to another wallet",code:"OWNER_MISMATCH"},403);
      await deps.save(proof);return c.json(proof);
    }catch(e){return failure(c,e);}
  });
  route.get("/ghost/me/vouchers",async c=>{
    try {
      const config=deps.config();requireDeployedConfig(config);const owner=c.get("walletAddress").toLowerCase();
      if(!await deps.limit("private_proof",owner))return c.json({error:"Try again in a minute",code:"RATE_LIMITED"},429);
      const before=c.req.query("before")??"0x"+"f".repeat(64);if(!hashPattern.test(before))return c.json({error:"Invalid list cursor"},400);
      const result=await getPool().query("SELECT voucher_id,reserve_tx_hash FROM ghost_vouchers WHERE owner_address=$1 AND chain_id=97 AND vault_address=$2 AND voucher_id<$3 ORDER BY voucher_id DESC LIMIT 20",[owner,config.vaultAddress.toLowerCase(),before.toLowerCase()]);
      const items=[];
      for(let i=0;i<result.rows.length;i+=3)items.push(...await Promise.all(result.rows.slice(i,i+3).map(async(row:{voucher_id:Hash;reserve_tx_hash:Hash})=>({...await deps.read(row.voucher_id),reserveTxHash:row.reserve_tx_hash}))));
      return c.json({items,next:items.length===20?result.rows.at(-1)?.voucher_id:null});
    }catch(e){return failure(c,e);}
  });
  route.post("/ghost/me/recover",async c=>{
    const body=await c.req.json().catch(()=>null);if(!body || Object.keys(body).some(k=>k!=="cursor") || (body.cursor!==undefined && typeof body.cursor!=="string"))return c.json({error:"Invalid recovery request"},400);
    try {
      const config=deps.config();requireDeployedConfig(config);const owner=getAddress(c.get("walletAddress"));
      if(!await deps.limit("owner_recovery",owner))return c.json({error:"Recovery rate limit; retry next minute",code:"RATE_LIMITED"},429);
      const rpc=ghostRpc(),head=await rpc.getBlockNumber();
      const confirmedHead=head>=BigInt(config.confirmationsRequired-1)?head-BigInt(config.confirmationsRequired-1):0n;
      if(!body.cursor && confirmedHead<BigInt(config.deploymentBlock))return c.json({items:[],next:null});
      let cursor:RecoveryCursor={v:1,chain:97,vault:config.vaultAddress.toLowerCase(),owner:owner.toLowerCase(),next:config.deploymentBlock,upper:confirmedHead.toString(),expires:Math.floor(Date.now()/1000)+900};
      if(body.cursor) { try {cursor=decodeCursor(body.cursor);}catch{return c.json({error:"Invalid or expired recovery cursor"},400);} }
      if(cursor.owner!==owner.toLowerCase() || cursor.vault!==config.vaultAddress.toLowerCase() || BigInt(cursor.next)<BigInt(config.deploymentBlock) || BigInt(cursor.upper)>head || BigInt(cursor.next)>BigInt(cursor.upper)+1n)return c.json({error:"Recovery cursor does not match this owner or deployment"},400);
      const from=BigInt(cursor.next),upper=BigInt(cursor.upper);
      if(from>upper)return c.json({items:[],next:null});
      let range=1000n,logs,to:bigint;
      for(;;) {
        to=from+range-1n<upper?from+range-1n:upper;
        try {logs=await rpc.getContractEvents({address:config.vaultAddress,abi:ghostAbi,eventName:"VoucherReserved",args:{owner},fromBlock:from,toBlock:to,strict:true});break;}
        catch(e){if(range<=32n)throw e;range/=2n;}
      }
      const page=recoveryPage(logs,cursor,to),items=[];
      for(const log of page.items) {
        const proof=await verifyGhostProof(rpc,config,log.args.voucherId,log.transactionHash!,"reserve");
        if(getAddress(proof.owner)!==owner)throw new GhostChainError("PROOF_MISMATCH","Recovered event belongs to another owner.");
        await deps.save(proof);items.push(proof);
      }
      return c.json({items,next:page.next?encodeCursor(page.next):null});
    }catch(e){return failure(c,e);}
  });
  return route;
}
