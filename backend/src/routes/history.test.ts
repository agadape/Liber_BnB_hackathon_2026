import { authHeaders } from "../auth/test-helpers.js";
// backend/src/routes/history.test.ts
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { getPool } from "../db/pool.js";
import { migrate } from "../db/migrate.js";

before(async () => {
  await migrate();
});

test("GET /users/:id/history returns scans and topups merged, newest first", async () => {
  const pool = getPool();
  const { rows: userRows } = await pool.query(
    `INSERT INTO users (wallet_address) VALUES ($1) RETURNING id`,
    [`0x0000000000000000000000000000${Math.random().toString(16).slice(2, 14).padEnd(12, "0")}`]
  );
  const userId = userRows[0].id;

  await pool.query(
    `INSERT INTO qris_scans (user_id, merchant_name, merchant_city, amount_idr, amount_usdc, created_at)
     VALUES ($1, 'Warung A', 'Jakarta', 10000, '0.62', now() - interval '2 hour')`,
    [userId]
  );
  await pool.query(
    `INSERT INTO kolo_topups (user_id, amount_usdc, tx_hash, created_at)
     VALUES ($1, '5.00', 'hash1', now() - interval '1 hour')`,
    [userId]
  );

  const app = createApp();
  const res = await app.request(`/users/${userId}/history`, { headers: await authHeaders(userId) });
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.entries.length, 2);

  assert.equal(body.entries[0].type, "topup");
  assert.equal(body.entries[0].amountUsdc, "5.00");
  assert.equal(body.entries[0].txHash, "hash1");
  assert(body.entries[0].createdAt, "createdAt should be present");

  assert.equal(body.entries[1].type, "scan");
  assert.equal(body.entries[1].merchantName, "Warung A");
  assert.equal(body.entries[1].merchantCity, "Jakarta");
  assert.equal(body.entries[1].amountIdr, "10000");
  assert.equal(body.entries[1].amountUsdc, "0.62");
  assert(body.entries[1].createdAt, "createdAt should be present");
});

test("GET /users/:id/history returns 404 for nonexistent user", async () => {
  const app = createApp();
  const res = await app.request("/users/00000000-0000-0000-0000-000000000000/history", { headers: await authHeaders() });
  const body = await res.json();

  assert.equal(res.status, 404);
  assert.equal(body.error, "user not found");
});
