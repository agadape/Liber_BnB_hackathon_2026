import { getOrCreateWallet, LocalStorageWalletStorage, type WalletStorage } from "./storage";
import { createWalletClient, http, type Hash, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CHAIN, RPC_URL } from "../chain";
import type { EvmTxRequest } from "./topup";
import { getConnectedExternalAddress, sendWithExternalWallet, disconnectExternalWallet, signWithExternalWallet } from "./externalWallet";

const WALLET_MODE_KEY = "liber:wallet:mode";

export type ActiveWallet =
  | { mode: "local"; publicKey: string; secretKey: string }
  | { mode: "external"; publicKey: string };

export async function signActiveWallet(wallet: ActiveWallet, message: string): Promise<Hex> {
  if (wallet.mode === "external") return signWithExternalWallet(wallet.publicKey, message);
  return privateKeyToAccount(wallet.secretKey as Hex).signMessage({ message });
}

export function getWalletMode(): "local" | "external" {
  return window.localStorage.getItem(WALLET_MODE_KEY) === "external" ? "external" : "local";
}

export function setExternalWalletMode(): void {
  window.localStorage.setItem(WALLET_MODE_KEY, "external");
}

export function setLocalWalletMode(): void {
  window.localStorage.setItem(WALLET_MODE_KEY, "local");
}

export async function getActiveWallet(
  storage: WalletStorage = new LocalStorageWalletStorage(),
  getExternalAddress: () => Promise<string | null> = getConnectedExternalAddress
): Promise<ActiveWallet> {
  if (getWalletMode() === "external") {
    const publicKey = await getExternalAddress();
    if (publicKey) return { mode: "external", publicKey };
    // The user was in external mode but nothing is actually connected anymore
    // (e.g. they revoked access in their wallet) - fall back to a local wallet
    // rather than getting stuck.
  }
  const wallet = await getOrCreateWallet(storage);
  return { mode: "local", publicKey: wallet.publicKey, secretKey: wallet.secretKey };
}

/** Local-wallet sender: signs with the device-held private key and broadcasts over the BSC RPC. */
export async function sendWithLocalKey(secretKey: string, tx: EvmTxRequest): Promise<Hash> {
  const client = createWalletClient({
    account: privateKeyToAccount(secretKey as Hex),
    chain: CHAIN,
    transport: http(RPC_URL),
  });
  return client.sendTransaction({ to: tx.to, data: tx.data });
}

/** Signs and broadcasts `tx` from the active wallet on BNB Chain; returns the tx hash. */
export async function sendActiveWallet(
  wallet: ActiveWallet,
  tx: EvmTxRequest,
  sendExternal: (tx: EvmTxRequest, address: string) => Promise<string> = sendWithExternalWallet,
  sendLocal: (secretKey: string, tx: EvmTxRequest) => Promise<string> = sendWithLocalKey
): Promise<string> {
  if (wallet.mode === "external") {
    return sendExternal(tx, wallet.publicKey);
  }
  return sendLocal(wallet.secretKey, tx);
}

export async function disconnectAndSwitchToLocal(
  disconnect: () => Promise<void> = disconnectExternalWallet
): Promise<void> {
  await disconnect();
  setLocalWalletMode();
}
