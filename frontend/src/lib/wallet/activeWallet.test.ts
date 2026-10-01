import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { MemoryWalletStorage, getOrCreateWallet } from "./storage.js";
import {
  getActiveWallet,
  sendActiveWallet,
  getWalletMode,
  setExternalWalletMode,
  setLocalWalletMode,
} from "./activeWallet.js";

// getWalletMode/setExternalWalletMode/setLocalWalletMode read/write window.localStorage directly;
// node:test runs in Node, which doesn't have `window`, so stub a minimal one for these tests.
beforeEach(() => {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
    },
  });
});

test("getWalletMode defaults to local when never set", () => {
  assert.equal(getWalletMode(), "local");
});

test("setExternalWalletMode / setLocalWalletMode toggle the stored mode", () => {
  setExternalWalletMode();
  assert.equal(getWalletMode(), "external");
  setLocalWalletMode();
  assert.equal(getWalletMode(), "local");
});

test("getActiveWallet returns a local wallet when mode is local", async () => {
  setLocalWalletMode();
  const storage = new MemoryWalletStorage();
  const expected = await getOrCreateWallet(storage);

  const wallet = await getActiveWallet(storage, async () => null);

  assert.deepEqual(wallet, { mode: "local", publicKey: expected.publicKey, secretKey: expected.secretKey });
});

test("getActiveWallet returns an external wallet when mode is external and a wallet is connected", async () => {
  setExternalWalletMode();
  const storage = new MemoryWalletStorage();

  const wallet = await getActiveWallet(storage, async () => "0xEXTERNALADDRESS");

  assert.deepEqual(wallet, { mode: "external", publicKey: "0xEXTERNALADDRESS" });
});

test("a disconnected external wallet does not silently create or authenticate a device wallet", async () => {
  setExternalWalletMode();
  const storage = new MemoryWalletStorage();
  await assert.rejects(getActiveWallet(storage, async () => null), /Wallet disconnected/);
  assert.equal(getWalletMode(), "external");
  assert.equal(await storage.get("liber:wallet:secretKey"), null);
  assert.equal(await storage.get("liber:wallet:publicKey"), null);
});

const TX = { to: "0x000000000000000000000000000000000000dEaD" as const, data: "0xa9059cbb" as const };

test("sendActiveWallet sends with the local key for a local wallet", async () => {
  const wallet = { mode: "local" as const, publicKey: "0xLOCAL", secretKey: "0xSECRET" };

  let externalCalled = false;
  const result = await sendActiveWallet(
    wallet,
    TX,
    async () => {
      externalCalled = true;
      return "SHOULD_NOT_BE_CALLED";
    },
    async (secretKey, tx) => {
      assert.equal(secretKey, "0xSECRET");
      assert.deepEqual(tx, TX);
      return "0xLOCALHASH";
    }
  );

  assert.equal(externalCalled, false);
  assert.equal(result, "0xLOCALHASH");
});

test("sendActiveWallet delegates to the external wallet for an external wallet", async () => {
  const wallet = { mode: "external" as const, publicKey: "0xEXTERNAL" };

  const result = await sendActiveWallet(wallet, TX, async (tx, address) => {
    assert.deepEqual(tx, TX);
    assert.equal(address, "0xEXTERNAL");
    return "0xEXTERNALHASH";
  });

  assert.equal(result, "0xEXTERNALHASH");
});
