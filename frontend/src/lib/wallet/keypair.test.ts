import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeypair, addressFromSecret } from "./keypair.js";

test("generateKeypair returns a valid EVM keypair", () => {
  const { publicKey, secretKey } = generateKeypair();
  assert.match(publicKey, /^0x[0-9a-fA-F]{40}$/);
  assert.match(secretKey, /^0x[0-9a-f]{64}$/);
  assert.equal(addressFromSecret(secretKey), publicKey);
});

test("addressFromSecret accepts keys without the 0x prefix and rejects garbage", () => {
  const { publicKey, secretKey } = generateKeypair();
  assert.equal(addressFromSecret(secretKey.slice(2)), publicKey);
  assert.throws(() => addressFromSecret("not-a-key"));
});
