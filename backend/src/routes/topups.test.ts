import { test, before } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { getPool } from "../db/pool.js";
import { migrate } from "../db/migrate.js";
import { createTopupsRoute } from "./topups.js";
import { authHeaders } from "../auth/test-helpers.js";
import { InvalidTopupError } from "../chain/topup.js";

before(migrate);
const token = "0x0000000000000000000000000000000000000001" as const;
async function fixture() {
  const owner = privateKeyToAccount(generatePrivateKey()).address;
  const destination = privateKeyToAccount(generatePrivateKey()).address;
  const { rows } = await getPool().query("INSERT INTO users(wallet_address,kolo_address) VALUES($1,$2) RETURNING id", [owner,destination]);
  return { id: rows[0].id, owner, destination, headers: await authHeaders(rows[0].id), txHash: `0x${randomBytes(32).toString("hex")}` };
}
test("logs a checked transfer once and safely retries concurrent duplicate requests", async () => {
  const f = await fixture();
  const route = createTopupsRoute(async p => {
    assert.equal(p.sender, f.owner); assert.equal(p.destination, f.destination); assert.equal(p.txHash, f.txHash);
    return { amountUsdc: "5", chainId: 97, tokenAddress: token };
  });
  const request = () => route.request(`/users/${f.id}/topups`, { method: "POST", headers: f.headers, body: JSON.stringify({ amountUsdc: "5.00", txHash: f.txHash }) });
  const responses = await Promise.all([request(), request()]);
  assert.deepEqual(responses.map(r=>r.status).sort(), [200,201]);
  assert.equal((await responses[0].json()).id, (await responses[1].json()).id);
  const data = await getPool().query("SELECT amount_usdc,verified,chain_id,destination_address FROM kolo_topups WHERE tx_hash=$1", [f.txHash]);
  assert.equal(data.rows.length, 1);
  assert.equal(Number(data.rows[0].amount_usdc), 5);
  assert.equal(data.rows[0].verified, true);
  assert.equal(data.rows[0].chain_id,97);
  assert.equal(data.rows[0].destination_address,f.destination);
});
test("rejects spoofed amounts and invalid transaction hashes", async () => {
  const f = await fixture();
  const route = createTopupsRoute(async () => ({ amountUsdc: "4", chainId: 97, tokenAddress: token }));
  const send = (amountUsdc: string, txHash = f.txHash) => route.request(`/users/${f.id}/topups`, { method:"POST",headers:f.headers,body:JSON.stringify({amountUsdc,txHash}) });
  assert.equal((await send("5.00")).status,400);
  assert.equal((await send("0")).status,400);
  assert.equal((await send("5", "hash1")).status,400);
  const rows = await getPool().query("SELECT id FROM kolo_topups WHERE tx_hash=$1", [f.txHash]);
  assert.equal(rows.rowCount,0);
});
test("invalid or unconfirmed receipts never produce history records", async () => {
  const f = await fixture();
  for (const [error,status] of [[new InvalidTopupError("No matching transfer"),400],[new Error("Receipt not found"),409]] as const) {
    const route = createTopupsRoute(async () => { throw error; });
    const res = await route.request(`/users/${f.id}/topups`, { method:"POST",headers:f.headers,body:JSON.stringify({amountUsdc:"5",txHash:f.txHash}) });
    assert.equal(res.status,status);
  }
  const rows = await getPool().query("SELECT id FROM kolo_topups WHERE tx_hash=$1", [f.txHash]);
  assert.equal(rows.rowCount,0);
});
test("unknown user returns 404 only after wallet authentication", async () => {
  const res = await createTopupsRoute().request("/users/00000000-0000-0000-0000-000000000000/topups", {method:"POST",headers:await authHeaders(),body:"{}"});
  assert.equal(res.status,404);
});
