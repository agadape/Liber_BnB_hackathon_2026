import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeEventTopics, encodeAbiParameters, erc20Abi, type TransactionReceipt } from "viem";
import { readVerifiedTransfer } from "./topup.js";

const token = "0x0000000000000000000000000000000000000001", sender = "0x0000000000000000000000000000000000000002", destination = "0x0000000000000000000000000000000000000003";
const receipt = () => ({ status: "success", from: sender, to: token, logs: [{ address: token,
  topics: encodeEventTopics({ abi: erc20Abi, eventName: "Transfer", args: { from: sender, to: destination } }),
  data: encodeAbiParameters([{ type: "uint256" }], [5n * 10n ** 18n]) }] }) as unknown as TransactionReceipt;

test("reads the exact confirmed transfer amount from token event data", () => {
  assert.equal(readVerifiedTransfer(receipt(), token, sender, destination, 18), "5");
});
test("rejects reverted receipts, wrong senders, token contracts and destinations", () => {
  const reverted = receipt(); reverted.status = "reverted";
  assert.throws(() => readVerifiedTransfer(reverted, token, sender, destination, 18));
  assert.throws(() => readVerifiedTransfer(receipt(), token, destination, destination, 18));
  assert.throws(() => readVerifiedTransfer(receipt(), sender, sender, destination, 18));
  assert.throws(() => readVerifiedTransfer(receipt(), token, sender, sender, 18));
});
test("rejects unrelated logs and duplicate matching transfer events", () => {
  const unrelated = receipt(); unrelated.logs[0].address = sender;
  assert.throws(() => readVerifiedTransfer(unrelated, token, sender, destination, 18));
  const duplicate = receipt(); duplicate.logs.push(duplicate.logs[0]);
  assert.throws(() => readVerifiedTransfer(duplicate, token, sender, destination, 18));
});
