import { test, before } from "node:test";
import assert from "node:assert/strict";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createSiweMessage } from "viem/siwe";
import { getPool } from "../db/pool.js";
import { migrate } from "../db/migrate.js";
import { createApp } from "../app.js";
import { AUTH_STATEMENT, tokenHash } from "./auth.js";
import { authHeaders } from "./test-helpers.js";

before(migrate);
const newAccount = () => privateKeyToAccount(generatePrivateKey());
const post = (path: string, body: unknown, headers = {}) => createApp().request(path, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

async function challenge(account = newAccount()) {
  const response = await post("/auth/challenge", { walletAddress: account.address });
  assert.equal(response.status, 200);
  const c = await response.json();
  const message = createSiweMessage({ address: c.walletAddress, domain: c.domain, uri: c.uri, version: "1", chainId: c.chainId, nonce: c.nonce, issuedAt: new Date(c.issuedAt), expirationTime: new Date(c.expiresAt), statement: AUTH_STATEMENT });
  return { account, c, message };
}

test("valid signature creates a hashed session; a challenge can only be consumed once", async () => {
  const { account, c, message } = await challenge();
  const signature = await account.signMessage({ message });
  const res = await post("/auth/verify", { nonce: c.nonce, signature });
  assert.equal(res.status, 200);
  const session = await res.json();
  const rows = await getPool().query("SELECT token_hash FROM auth_sessions WHERE wallet_address=$1", [account.address]);
  assert.equal(rows.rows[0].token_hash, tokenHash(session.token));
  assert.notEqual(rows.rows[0].token_hash, session.token);
  assert.equal((await post("/auth/verify", { nonce: c.nonce, signature })).status, 401);
  assert.equal((await createApp().request(`/users/by-address/${account.address}`, { headers: { Authorization: `Bearer ${session.token}` } })).status, 404);
});

test("wrong wallet signature fails without consuming the owner's challenge", async () => {
  const { account, c, message } = await challenge();
  const badSignature = await newAccount().signMessage({ message });
  assert.equal((await post("/auth/verify", { nonce: c.nonce, signature: badSignature })).status, 401);
  const signature = await account.signMessage({ message });
  const results = await Promise.all([post("/auth/verify", { nonce: c.nonce, signature }), post("/auth/verify", { nonce: c.nonce, signature })]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 401]);
});

test("expired nonce, expired session and revoked session cannot authenticate", async () => {
  const { account, c, message } = await challenge();
  await getPool().query("UPDATE auth_challenges SET expires_at=now()-interval '1 second' WHERE nonce=$1", [c.nonce]);
  assert.equal((await post("/auth/verify", { nonce: c.nonce, signature: await account.signMessage({ message }) })).status, 401);
  const headers = await authHeaders(undefined, account.address);
  assert.equal((await post("/auth/logout", {}, headers)).status, 200);
  assert.equal((await createApp().request(`/users/by-address/${account.address}`, { headers })).status, 401);
  const expired = await authHeaders(undefined, account.address);
  await getPool().query("UPDATE auth_sessions SET expires_at=now()-interval '1 second' WHERE token_hash=$1", [tokenHash(expired.Authorization.slice(7))]);
  assert.equal((await createApp().request(`/users/by-address/${account.address}`, { headers: expired })).status, 401);
});

test("anonymous and another wallet cannot read or change a user's records", async () => {
  const owner = newAccount(), attacker = newAccount();
  const { rows } = await getPool().query("INSERT INTO users(wallet_address) VALUES($1) RETURNING id", [owner.address]);
  const id = rows[0].id;
  const headers = await authHeaders(undefined, attacker.address);
  for (const path of ["history", "balance", "kolo-address", "scans", "topups"]) {
    const method = ["history", "balance"].includes(path) ? "GET" : "POST";
    const init = { method, headers, ...(method === "POST" ? { body: JSON.stringify({ koloAddress: attacker.address }) } : {}) };
    assert.equal((await createApp().request(`/users/${id}/${path}`, init)).status, 403, path);
    assert.equal((await createApp().request(`/users/${id}/${path}`, { ...init, headers: {} })).status, 401, path);
  }
  assert.equal((await createApp().request(`/users/by-address/${owner.address}`, { headers })).status, 403);
  assert.equal((await post("/users", { walletAddress: owner.address }, headers)).status, 403);
  const user = await getPool().query("SELECT kolo_address FROM users WHERE id=$1", [id]);
  assert.equal(user.rows[0].kolo_address, null);
});
