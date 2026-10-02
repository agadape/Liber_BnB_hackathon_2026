import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { encodeAbiParameters, hexToBytes, type Address, type Hex } from "viem";
import { decodePacket, encodePacket, deserializeVoucher, voucherId, normalizeSignature, packetAbi, parseGhostAmount, serializeVoucher, validateSignature } from "./codec";
const fixture = JSON.parse(readFileSync(new URL("../../../../protocol/fixtures/ghost-v1-golden.json", import.meta.url), "utf8"));
const vault = fixture.vault as Address;
const v = deserializeVoucher(fixture.voucher);
const signature = fixture.signature as Hex;
function packet(encoded: Hex) { return "liber-ghost:v1:" + Buffer.from(hexToBytes(encoded)).toString("base64url"); }
test("golden viem packet round trips and matches the Solidity fixture", async () => {
  assert.equal(voucherId(vault, v), fixture.voucherId);
  assert.equal(encodePacket(vault, v, signature), fixture.packet);
  assert.equal(fixture.packet.length, 570);
  assert.deepEqual(await decodePacket(fixture.packet, vault), { vault, voucher: v, signature, id: fixture.voucherId });
});
test("rejects arbitrary URLs, QRIS, whitespace, oversize and malformed packet data", async () => {
  for (const raw of ["https://liber.test/pay?signature=" + signature, "000201010212", " " + fixture.packet, fixture.packet + "\n", fixture.packet + "=", "liber-ghost:v1:" + "a".repeat(1024), fixture.packet.slice(0, -1), fixture.packet.replace(/.$/, "!")])
    await assert.rejects(() => decodePacket(raw, vault));
});
test("rejects wrong version, chain, vault, mutated signed fields and ABI padding", async () => {
  for (const fields of [ [2, 97n, vault, v, signature], [1, 56n, vault, v, signature], [1, 97n, "0x3333333333333333333333333333333333333333", v, signature], [1, 97n, vault, {...v, amount: v.amount + 1n}, signature], [1, 97n, vault, {...v, validBefore: v.validBefore + 1n}, signature] ] as const) {
    await assert.rejects(() => decodePacket(packet(encodeAbiParameters(packetAbi, fields)), vault));
  }
  const bytes = Buffer.from(fixture.packet.slice("liber-ghost:v1:".length), "base64url");
  bytes[bytes.length - 1] = 1;
  await assert.rejects(() => decodePacket("liber-ghost:v1:" + bytes.toString("base64url"), vault));
});
test("EOA signatures are low-s, 65 bytes and normalize 0/1 only before QR encoding", async () => {
  const zeroV = (signature.slice(0, -2) + (parseInt(signature.slice(-2), 16) - 27).toString(16).padStart(2, "0")) as Hex;
  assert.equal(normalizeSignature(zeroV), signature);
  await assert.rejects(() => decodePacket(packet(encodeAbiParameters(packetAbi, [1,97n,vault,v,zeroV])), vault));
  for (const malformed of ["0x", signature.slice(0,-2), signature.slice(0,-2)+"ff", "0x"+"00".repeat(64)+"1b", signature.slice(0,66)+"ff".repeat(32)+"1b"])
    assert.throws(() => normalizeSignature(malformed as Hex));
  await assert.rejects(() => validateSignature("0x3333333333333333333333333333333333333333",v,signature));
});
test("decimal parsing preserves raw 18-decimal units without floats", () => {
  assert.equal(parseGhostAmount("0.000000000000000001"),1n);
  assert.equal(parseGhostAmount("1000"),1000n*10n**18n);
  for(const s of ["0","1000.000000000000000001","1e3","1,000","01","-1","1.0000000000000000001","NaN"," 1"])
    assert.throws(()=>parseGhostAmount(s));
  assert.throws(()=>deserializeVoucher({...serializeVoucher(v),signature}));
});
