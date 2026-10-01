import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import type { EIP1193Provider } from "viem";
import { connectExternalWallet, getConnectedExternalAddress, signWithExternalWallet } from "./externalWallet.js";
import { discoverWallets, registerWalletChooser, connectedProvider, forgetWalletProvider } from "./providers.js";

const ADDRESS = "0x1111111111111111111111111111111111111111";
const OTHER = "0x2222222222222222222222222222222222222222";
const SIGNATURE = `0x${"11".repeat(65)}`;
type Rpc = { method: string; params?: unknown };
const provider = (request: (rpc: Rpc) => unknown) => ({ request: async (rpc: Rpc) => request(rpc) }) as EIP1193Provider;
let page: EventTarget & { ethereum?: EIP1193Provider; localStorage: { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void } };
beforeEach(() => {
  const storage = new Map<string, string>();
  page = Object.assign(new EventTarget(), { localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); },
  } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: page });
});
function announce(eth: EIP1193Provider, name: string, uuid: string, rdns = `io.${name.toLowerCase()}`) {
  page.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail: { info: { name, uuid, rdns }, provider: eth } }));
}

test("the reported empty-account provider error becomes actionable and never switches chain or signs", async () => {
  const calls: string[] = [];
  page.ethereum = provider(({ method }) => { calls.push(method); throw Error("wallet must has at least one account\r\n"); });
  await assert.rejects(connectExternalWallet(), /unlock.*Select the account.*MetaMask/i);
  assert.deepEqual(calls, ["eth_requestAccounts"]);
});

test("an empty or malformed account response cannot be used for login", async () => {
  for (const response of [[], null, ["not-an-address"]]) {
    page.ethereum = provider(() => response);
    forgetWalletProvider();
    await assert.rejects(connectExternalWallet(), /unlock.*Select the account/i);
  }
});

test("MetaMask selected through discovery stays selected when another extension owns window.ethereum", async () => {
  const calls: string[] = [];
  const meta = provider(({ method }) => { calls.push(method); return method === "eth_chainId" ? "0x61" : method === "personal_sign" ? SIGNATURE : [ADDRESS]; });
  const competing = provider(() => { throw Error("wrong provider accessed"); });
  page.ethereum = competing;
  page.addEventListener("eip6963:requestProvider", () => announce(meta, "MetaMask", "one"));
  const unregister = registerWalletChooser(async options => options.find(option => option.name === "MetaMask")!);
  try {
    assert.equal(await connectExternalWallet(), ADDRESS);
    assert.equal(await getConnectedExternalAddress(), ADDRESS);
    assert.equal(await signWithExternalWallet(ADDRESS, "Sign in to Liber"), SIGNATURE);
    assert.ok(calls.includes("personal_sign"));
    assert.ok(!calls.includes("wallet_switchEthereumChain"));
  } finally { unregister(); }
});

test("a change of account during a network switch stops login", async () => {
  let chain = "0x1", active = ADDRESS;
  page.ethereum = provider(({ method }) => {
    if (method === "eth_chainId") return chain;
    if (method === "wallet_switchEthereumChain") { chain = "0x61"; active = OTHER; return null; }
    return [active];
  });
  await assert.rejects(connectExternalWallet(), /account changed while connecting/i);
});

test("adding the network is followed by switching and verifying its chain", async () => {
  let chain = "0x1", added = false;
  page.ethereum = provider(({ method }) => {
    if (method === "eth_chainId") return chain;
    if (method === "wallet_switchEthereumChain") {
      if (!added) throw Object.assign(new Error("unknown chain"), { code: 4902 });
      chain = "0x61"; return null;
    }
    if (method === "wallet_addEthereumChain") { added = true; return null; }
    return [ADDRESS];
  });
  assert.equal(await connectExternalWallet(), ADDRESS);
  assert.equal(chain, "0x61");
});

test("a wallet that ignores the chain switch cannot connect", async () => {
  page.ethereum = provider(({ method }) => method === "eth_chainId" ? "0x1" : method === "wallet_switchEthereumChain" ? null : [ADDRESS]);
  await assert.rejects(connectExternalWallet(), /Switch your wallet/);
});

test("account revocation or account change cannot sign using a stale address", async () => {
  let active: string[] = [ADDRESS];
  page.ethereum = provider(({ method }) => {
    if (method === "personal_sign") throw Error("must never sign");
    return method === "eth_chainId" ? "0x61" : active;
  });
  await connectExternalWallet();
  active = [OTHER];
  await assert.rejects(signWithExternalWallet(ADDRESS, "message"), /account changed/i);
  active = [];
  await assert.rejects(signWithExternalWallet(ADDRESS, "message"), /unlock/i);
});

test("user rejection and pending connection requests have distinct recovery steps", async () => {
  for (const [code, message] of [[4001, /cancelled/], [-32002, /already waiting/]] as const) {
    page.ethereum = provider(() => { throw Object.assign(new Error("provider error"), { code }); });
    await assert.rejects(connectExternalWallet(), message);
  }
});

test("discovery deduplicates reannouncements and a legacy provider with the same object", async () => {
  const meta = provider(() => [ADDRESS]);
  page.ethereum = meta;
  page.addEventListener("eip6963:requestProvider", () => { announce(meta, "MetaMask", "same"); announce(meta, "MetaMask", "same"); });
  assert.equal((await discoverWallets()).length, 1);
  assert.equal((await discoverWallets()).length, 1);
});

test("after reload, a remembered missing wallet cannot silently switch to another wallet", async () => {
  page.localStorage.setItem("liber:wallet:provider", "io.metamask");
  page.ethereum = provider(() => [OTHER]);
  await assert.rejects(connectedProvider(), /disconnected/);
});

test("cancelled wallet selection never asks an extension for accounts", async () => {
  page.ethereum = provider(() => { throw Error("must not request accounts"); });
  const unregister = registerWalletChooser(async () => null);
  try { await assert.rejects(connectExternalWallet(), /selection cancelled/); } finally { unregister(); }
});
