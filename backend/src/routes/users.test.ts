// backend/src/routes/users.test.ts
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { getPool } from "../db/pool.js";
import { migrate } from "../db/migrate.js";
import { createUsersRoute } from "./users.js";

before(async () => {
  await migrate();
});

const randomAddress = () => privateKeyToAccount(generatePrivateKey()).address;

async function insertUser(walletAddress = randomAddress()): Promise<string> {
  const { rows } = await getPool().query(`INSERT INTO users (wallet_address) VALUES ($1) RETURNING id`, [
    walletAddress,
  ]);
  return rows[0].id;
}

function postUsers(app: ReturnType<typeof createUsersRoute>, walletAddress: string) {
  return app.request("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });
}

test("POST /users returns the existing user without checking the chain when a row already exists", async () => {
  const walletAddress = randomAddress();
  await insertUser(walletAddress);

  let getNativeBalanceCalled = false;
  const app = createUsersRoute({
    getNativeBalance: async () => {
      getNativeBalanceCalled = true;
      return "0";
    },
  });

  const res = await postUsers(app, walletAddress);

  assert.equal(res.status, 200);
  assert.ok((await res.json()).userId);
  assert.equal(getNativeBalanceCalled, false);
});

test("POST /users returns awaiting_funding (202) when the wallet has no BNB for gas yet", async () => {
  const walletAddress = randomAddress();
  const app = createUsersRoute({ getNativeBalance: async () => "0" });

  const res = await postUsers(app, walletAddress);

  assert.equal(res.status, 202);
  assert.equal((await res.json()).status, "awaiting_funding");
  const { rows } = await getPool().query(`SELECT id FROM users WHERE wallet_address = $1`, [walletAddress]);
  assert.equal(rows.length, 0);
});

test("POST /users creates the user once the wallet has reached the activation balance", async () => {
  const walletAddress = randomAddress();
  const app = createUsersRoute({ getNativeBalance: async () => "0.01" });

  const res = await postUsers(app, walletAddress);

  assert.equal(res.status, 201);
  assert.ok((await res.json()).userId);
  const { rows } = await getPool().query(`SELECT id FROM users WHERE wallet_address = $1`, [walletAddress]);
  assert.equal(rows.length, 1);
});

test("POST /users returns a clear error response (not an unhandled crash) when the RPC throws", async () => {
  const app = createUsersRoute({
    getNativeBalance: async () => {
      throw new Error("RPC unavailable (simulated failure)");
    },
  });

  const res = await postUsers(app, randomAddress());

  assert.equal(res.status, 502);
  assert.match((await res.json()).error, /simulated failure/);
});

test("POST /users rejects an invalid address", async () => {
  const res = await postUsers(createUsersRoute(), "not-an-address");
  assert.equal(res.status, 400);
});

test("POST /users/:id/kolo-address saves a valid EVM address", async () => {
  const userId = await insertUser();
  const koloAddress = randomAddress();

  const res = await createUsersRoute().request(`/users/${userId}/kolo-address`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ koloAddress }),
  });

  assert.equal(res.status, 200);
  assert.equal((await res.json()).koloAddress, koloAddress);
  const { rows } = await getPool().query(`SELECT kolo_address FROM users WHERE id = $1`, [userId]);
  assert.equal(rows[0].kolo_address, koloAddress);
});

test("POST /users/:id/kolo-address rejects an invalid address", async () => {
  const userId = await insertUser();
  const res = await createUsersRoute().request(`/users/${userId}/kolo-address`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ koloAddress: "not-a-real-address" }),
  });
  assert.equal(res.status, 400);
});

test("POST /users/:id/kolo-address returns 404 for an unknown user", async () => {
  const res = await createUsersRoute().request("/users/00000000-0000-0000-0000-000000000000/kolo-address", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ koloAddress: randomAddress() }),
  });
  assert.equal(res.status, 404);
});

test("GET /users/by-address/:walletAddress returns the matching userId and saved Kolo address", async () => {
  const walletAddress = randomAddress();
  const koloAddress = randomAddress();
  const { rows } = await getPool().query(
    `INSERT INTO users (wallet_address, kolo_address) VALUES ($1, $2) RETURNING id`,
    [walletAddress, koloAddress]
  );

  const res = await createUsersRoute().request(`/users/by-address/${walletAddress.toLowerCase()}`);

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.userId, rows[0].id);
  assert.equal(body.koloAddress, koloAddress);
});

test("GET /users/by-address/:walletAddress returns 404 when no user has that address", async () => {
  const res = await createUsersRoute().request(`/users/by-address/${randomAddress()}`);
  assert.equal(res.status, 404);
});

test("GET /users/by-address/:walletAddress rejects a malformed address", async () => {
  const res = await createUsersRoute().request("/users/by-address/not-a-real-address");
  assert.equal(res.status, 400);
});
