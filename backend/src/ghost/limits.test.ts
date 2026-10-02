import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeCursor,decodeCursor,serverMac,type RecoveryCursor } from "./limits.js";
process.env.GHOST_SERVER_HMAC_SECRET="ab".repeat(32);
const cursor:RecoveryCursor={v:1,chain:97,vault:"0x1111111111111111111111111111111111111111",owner:"0x2222222222222222222222222222222222222222",next:"100",upper:"200",expires:Math.floor(Date.now()/1000)+900};
test("recovery cursors are authenticated, expire, and use a separate MAC purpose",()=>{
 const raw=encodeCursor(cursor);assert.deepEqual(decodeCursor(raw),cursor);
 const tampered=Buffer.from(JSON.stringify({...cursor,owner:"0x3333333333333333333333333333333333333333"})).toString("base64url")+"."+raw.split(".")[1];
 assert.throws(()=>decodeCursor(tampered));assert.throws(()=>decodeCursor(raw+"x"));
 assert.throws(()=>decodeCursor(encodeCursor({...cursor,expires:Math.floor(Date.now()/1000)-1})));
 assert.notEqual(serverMac("ghost-rate-v1","same"),serverMac("ghost-recovery-v1","same"));
});
test("dense-block log offsets stay authenticated and must be nonnegative integers",()=>{
 assert.deepEqual(decodeCursor(encodeCursor({...cursor,afterLog:12})),{...cursor,afterLog:12});
 for(const afterLog of [-1,1.5,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>decodeCursor(encodeCursor({...cursor,afterLog})));
});
