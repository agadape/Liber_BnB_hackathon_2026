import { test } from "node:test";
import assert from "node:assert/strict";
import { parseEther } from "viem";
import { getNativeBalance, isActivated, ACTIVATION_BALANCE_BNB } from "./account.js";

const ADDR = "0x000000000000000000000000000000000000dEaD";

test("getNativeBalance returns the BNB balance formatted in ether units", async () => {
  const result = await getNativeBalance(ADDR, async () => parseEther("0.5"));
  assert.equal(result, "0.5");
});

test("getNativeBalance rethrows RPC errors", async () => {
  await assert.rejects(
    getNativeBalance(ADDR, async () => {
      throw new Error("network blip");
    }),
    /network blip/
  );
});

test("ACTIVATION_BALANCE_BNB is 0.001", () => {
  assert.equal(ACTIVATION_BALANCE_BNB, 0.001);
});

test("isActivated is false for a null balance", () => {
  assert.equal(isActivated(null), false);
});

test("isActivated is false when the balance is below the activation threshold", () => {
  assert.equal(isActivated("0.0009"), false);
});

test("isActivated is true when the balance meets or exceeds the activation threshold", () => {
  assert.equal(isActivated("0.001"), true);
  assert.equal(isActivated("1"), true);
});
