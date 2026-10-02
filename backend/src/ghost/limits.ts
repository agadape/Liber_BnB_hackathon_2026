import { createHmac, timingSafeEqual } from "node:crypto";
import { getPool } from "../db/pool.js";
export function serverMac(purpose:string,data:string):string {
  const secret=process.env.GHOST_SERVER_HMAC_SECRET??"";
  if(!/^[a-fA-F0-9]{64,}$/.test(secret))throw Error("Ghost protection unavailable");
  return createHmac("sha256",Buffer.from(secret,"hex")).update(`${purpose}\0${data}`).digest("hex");
}
export async function ghostLimit(scope:"public_read"|"private_proof"|"owner_recovery",identity:string):Promise<boolean> {
  const count=scope==="public_read"?30:scope==="private_proof"?10:2;
  const window=Math.floor(Date.now()/60_000)*60;
  const hash=serverMac("ghost-rate-v1",identity.toLowerCase());
  const result=await getPool().query(`INSERT INTO ghost_rate_limits(scope,identity_hash,window_start,hits,expires_at) VALUES($1,$2,$3,1,now()+interval '10 minutes')
    ON CONFLICT(scope,identity_hash,window_start) DO UPDATE SET hits=ghost_rate_limits.hits+1 RETURNING hits`,[scope,hash,window]);
  if(scope!=="public_read")await getPool().query("DELETE FROM ghost_rate_limits WHERE (scope,identity_hash,window_start) IN (SELECT scope,identity_hash,window_start FROM ghost_rate_limits WHERE expires_at<now() LIMIT 500)");
  return BigInt(result.rows[0].hits)<=BigInt(count);
}
export interface RecoveryCursor {v:1;chain:97;vault:string;owner:string;next:string;upper:string;expires:number;afterLog?:number}
export function encodeCursor(cursor:RecoveryCursor):string {
  const payload=Buffer.from(JSON.stringify(cursor)).toString("base64url");
  return payload+"."+serverMac("ghost-recovery-v1",payload);
}
export function decodeCursor(raw:string):RecoveryCursor {
  if(raw.length>1024 || !/^[A-Za-z0-9_-]+\.[a-f0-9]{64}$/.test(raw))throw Error("Invalid recovery cursor");
  const [payload,mac]=raw.split(".");
  if(!timingSafeEqual(Buffer.from(mac,"hex"),Buffer.from(serverMac("ghost-recovery-v1",payload),"hex")))throw Error("Invalid recovery cursor");
  const cursor=JSON.parse(Buffer.from(payload,"base64url").toString()) as RecoveryCursor;
  if(cursor.v!==1 || cursor.chain!==97 || !/^\d+$/.test(cursor.next) || !/^\d+$/.test(cursor.upper) || !Number.isInteger(cursor.expires) || cursor.expires<=Math.floor(Date.now()/1000) || (cursor.afterLog!==undefined && (!Number.isSafeInteger(cursor.afterLog)||cursor.afterLog<0)))throw Error("Recovery cursor expired or invalid");
  return cursor;
}
