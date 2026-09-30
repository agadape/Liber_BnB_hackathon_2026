import assert from "node:assert/strict";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createSiweMessage } from "viem/siwe";

const api = "https://liber-bnb-api.vercel.app";
const web = "https://liber-bnb-web.vercel.app";
const owner = privateKeyToAccount(generatePrivateKey());
const attacker = privateKeyToAccount(generatePrivateKey());
const post = (path: string, body: unknown, token?: string) => fetch(`${api}${path}`, { method: "POST", signal: AbortSignal.timeout(15_000), headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
let ready = false;
for (let attempt = 0; attempt < 24; attempt++) {
  const health = await fetch(`${api}/health`, { headers: { Origin: web }, signal: AbortSignal.timeout(10_000) }).catch(() => null);
  const page = await fetch(web, { signal: AbortSignal.timeout(10_000) }).catch(() => null);
  const body = await health?.json().catch(() => null);
  const html = await page?.text();
  if (health?.ok && body?.version === "merchant-copilot-v1" && page?.ok && html?.includes("BSC Testnet Demo")) {
    assert.equal(health.headers.get("access-control-allow-origin"), web);
    ready = true; break;
  }
  await new Promise(resolve => setTimeout(resolve, 5_000));
}
assert.ok(ready, "Updated production deployment did not become ready");
const config = await (await fetch(`${api}/config`)).json();
assert.equal(config.chainId, 97); assert.ok(config.contractAddress, "Invoice contract missing");
const sample = await post("/copilot/demo", {sample:"valid"});
assert.equal(sample.status,200); const inspected=await sample.json();
assert.equal(inspected.facts.checksumValid,true); assert.equal(inspected.facts.merchantIdentityVerified,false);
assert.equal((await post("/copilot/demo",{sample:"corrupt"})).status,400);
assert.equal((await post("/copilot/explain",{payload:"anything"})).status,401);
const challengeRes = await post("/auth/challenge", { walletAddress: owner.address });
assert.equal(challengeRes.status, 200);
const c = await challengeRes.json();
assert.equal(c.domain, "liber-bnb-web.vercel.app");
assert.equal(c.chainId, 97);
const message = createSiweMessage({ address: c.walletAddress, domain: c.domain, uri: c.uri, version: "1", chainId: c.chainId, nonce: c.nonce, issuedAt: new Date(c.issuedAt), expirationTime: new Date(c.expiresAt), statement: "Sign in to Liber. This does not authorize a transfer or grant access to your funds." });
assert.equal((await post("/auth/verify", { nonce: c.nonce, signature: await attacker.signMessage({ message }) })).status, 401);
const proof = { nonce: c.nonce, signature: await owner.signMessage({ message }) };
const verified = await post("/auth/verify", proof);
assert.equal(verified.status, 200);
const { token } = await verified.json();
try {
  assert.equal((await post("/auth/verify", proof)).status, 401);
  const lookup = `/users/by-address/${owner.address}`;
  assert.equal((await fetch(`${api}${lookup}`)).status, 401);
  assert.equal((await fetch(`${api}${lookup}`, { headers: { Authorization: `Bearer ${token}` } })).status, 404);
  assert.equal((await fetch(`${api}/users/by-address/${attacker.address}`, { headers: { Authorization: `Bearer ${token}` } })).status, 403);
  assert.equal((await post("/users/00000000-0000-0000-0000-000000000001/kolo-address", { koloAddress: attacker.address })).status, 401);
} finally {
  assert.equal((await post("/auth/logout", {}, token)).status, 200);
}
console.log("Production web, CORS, database-backed wallet authentication, nonce replay and anonymous write checks passed.");
