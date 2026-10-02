import {test} from "node:test";
import assert from "node:assert/strict";
import {recoveryPage} from "./recovery.js";
import type {RecoveryCursor} from "./limits.js";
const cursor:RecoveryCursor={v:1,chain:97,vault:"0x"+"1".repeat(40),owner:"0x"+"2".repeat(40),next:"100",upper:"200",expires:1800000000};
const events=Array.from({length:12},(_,logIndex)=>({blockNumber:100n,logIndex}));
test("dense single-block recovery advances without skipping or repeating events",()=>{
 const first=recoveryPage([...events].reverse(),cursor,150n);assert.deepEqual(first.items.map(l=>l.logIndex),[0,1,2,3,4]);assert.equal(first.next?.next,"100");assert.equal(first.next?.afterLog,4);
 const second=recoveryPage(events,first.next!,150n);assert.deepEqual(second.items.map(l=>l.logIndex),[5,6,7,8,9]);assert.equal(second.next?.afterLog,9);
 const third=recoveryPage(events,second.next!,150n);assert.deepEqual(third.items.map(l=>l.logIndex),[10,11]);assert.equal(third.next?.next,"151");assert.equal(third.next?.afterLog,undefined);
});
test("recovery cursor progresses correctly across block boundaries and empty pages",()=>{
 const logs=[...events.slice(0,4),{blockNumber:101n,logIndex:0},{blockNumber:101n,logIndex:1}];
 const page=recoveryPage(logs,cursor,150n);assert.equal(page.next?.next,"101");assert.equal(page.next?.afterLog,0);
 const rest=recoveryPage(logs.slice(4),page.next!,150n);assert.deepEqual(rest.items.map(l=>l.logIndex),[1]);assert.equal(rest.next?.next,"151");
 assert.equal(recoveryPage([],cursor,200n).next,null);
 assert.equal(recoveryPage([],cursor,150n).next?.next,"151");
});
test("malformed, duplicate and out-of-range recovery logs fail closed",()=>{
 const invalid: {blockNumber:bigint|null;logIndex:number|null}[][]=[[{blockNumber:null,logIndex:0}],[{blockNumber:100n,logIndex:null}],[{blockNumber:99n,logIndex:0}],[{blockNumber:201n,logIndex:0}],[events[0],events[0]]];
 for(const logs of invalid)assert.throws(()=>recoveryPage(logs,cursor,200n));
 assert.throws(()=>recoveryPage([],cursor,99n));assert.throws(()=>recoveryPage([],cursor,201n));assert.throws(()=>recoveryPage([],{...cursor,upper:"5000"},1100n));
});
