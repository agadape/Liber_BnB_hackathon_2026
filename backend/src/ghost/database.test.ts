import {test,before,after} from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {getPool,databaseConnectionString} from "../db/pool.js";
import {migrate} from "../db/migrate.js";
import {ghostLimit,serverMac} from "./limits.js";
const identity="ghost-test-"+randomUUID();
before(async()=>{process.env.GHOST_SERVER_HMAC_SECRET="ab".repeat(32);await migrate();});
after(async()=>{await getPool().query("DELETE FROM ghost_rate_limits WHERE identity_hash=$1",[serverMac("ghost-rate-v1",identity)]);await getPool().end();});
test("Neon integration aliases preserve explicit DATABASE_URL precedence",()=>{
 assert.equal(databaseConnectionString({DATABASE_URL:"explicit",DATABASE_POSTGRES_PRISMA_URL:"alias"}),"explicit");
 assert.equal(databaseConnectionString({DATABASE_POSTGRES_PRISMA_URL:"alias"}),"alias");
 assert.equal(databaseConnectionString({}),undefined);
});
test("Ghost tables have precision and canonical proof uniqueness constraints",async()=>{
 const p=getPool();const tables=await p.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('ghost_vouchers','ghost_proofs','ghost_rate_limits')");assert.equal(tables.rowCount,3);
 const amount=await p.query("SELECT numeric_precision,numeric_scale FROM information_schema.columns WHERE table_schema='public' AND table_name='ghost_vouchers' AND column_name='amount_raw'");assert.equal(amount.rows[0].numeric_precision,78);assert.equal(amount.rows[0].numeric_scale,0);
 const columns=await p.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('ghost_vouchers','ghost_proofs')");assert.ok(!columns.rows.some(r=>/signature|packet|private.*key/.test(r.column_name)));
 const index=await p.query("SELECT indexdef FROM pg_indexes WHERE schemaname='public' AND indexname='ghost_proofs_canonical_action_idx'");assert.match(index.rows[0].indexdef,/UNIQUE.*WHERE canonical/);
});
test("concurrent public reads share one durable rate bucket and admit exactly 30",async()=>{
 const allowed=await Promise.all(Array.from({length:40},()=>ghostLimit("public_read",identity)));assert.equal(allowed.filter(Boolean).length,30);
 const rows=await getPool().query("SELECT hits FROM ghost_rate_limits WHERE identity_hash=$1 AND scope='public_read'",[serverMac("ghost-rate-v1",identity)]);assert.equal(rows.rowCount,1);assert.equal(Number(rows.rows[0].hits),40);
});
