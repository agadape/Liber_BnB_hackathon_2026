import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeFunctionData, erc20Abi } from "viem";
import { buildTopUpTx } from "./topup.js";

const USDC = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
const KOLO = "0x000000000000000000000000000000000000dEaD";

test("buildTopUpTx produces an ERC-20 transfer of USDC (18 decimals) to the destination", () => {
  const tx = buildTopUpTx({ usdcAddress: USDC, destinationAddress: KOLO, amountUsdc: "5.00", decimals: 18 });

  assert.equal(tx.to, USDC);
  const decoded = decodeFunctionData({ abi: erc20Abi, data: tx.data });
  assert.equal(decoded.functionName, "transfer");
  assert.equal(decoded.args[0], KOLO);
  assert.equal(decoded.args[1], BigInt(5) * BigInt(10) ** BigInt(18));
});

test("buildTopUpTx respects a non-18 decimals token", () => {
  const tx = buildTopUpTx({ usdcAddress: USDC, destinationAddress: KOLO, amountUsdc: "1.25", decimals: 6 });
  const decoded = decodeFunctionData({ abi: erc20Abi, data: tx.data });
  assert.equal(decoded.args[1], BigInt(1_250_000));
});
