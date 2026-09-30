import { test } from "node:test";
import assert from "node:assert/strict";
import { challengeMessage, type Challenge } from "./auth.js";
import { CHAIN } from "./chain.js";

const address = "0x0000000000000000000000000000000000000001";
const now = Date.parse("2026-09-30T00:00:00Z");
const valid: Challenge = { nonce: "a".repeat(32), walletAddress: address, domain: "liber.test", uri: "https://liber.test", chainId: CHAIN.id,
  issuedAt: new Date(now).toISOString(), expiresAt: new Date(now+300_000).toISOString() };
test("constructs a sign-in message that never authorizes a transfer", () => {
  const message = challengeMessage(valid, address, "https://liber.test", now);
  assert.match(message, /This does not authorize a transfer/);
  assert.match(message, new RegExp(`Chain ID: ${CHAIN.id}`));
});
test("refuses to sign challenges for another origin, chain, wallet or expiry", () => {
  for (const altered of [{ domain:"evil.test" },{ uri:"https://evil.test" },{ chainId:CHAIN.id+1 },{ walletAddress:"0x0000000000000000000000000000000000000002" },
    { expiresAt:new Date(now-1).toISOString() },{ expiresAt:new Date(now+600_000).toISOString() },{ nonce:"invalid" }])
    assert.throws(() => challengeMessage({ ...valid, ...altered },address,"https://liber.test",now));
});
