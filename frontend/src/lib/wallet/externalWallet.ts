import { createWalletClient, custom, numberToHex, getAddress, type Address, type EIP1193Provider, type Hash } from "viem";
import { CHAIN } from "../chain";
import type { EvmTxRequest } from "./topup";

/**
 * External wallets are any injected EIP-1193 provider (MetaMask, Trust Wallet, Binance Web3 Wallet,
 * OKX, Rabby...). Only touched inside user-triggered handlers, so SSR never evaluates `window.ethereum`.
 */
function provider(): EIP1193Provider {
  const eth = (globalThis as { window?: { ethereum?: EIP1193Provider } }).window?.ethereum;
  if (!eth) throw new Error("No browser wallet found. Install MetaMask, Trust Wallet, or Binance Web3 Wallet.");
  return eth;
}

async function ensureBnbChain(eth: EIP1193Provider): Promise<void> {
  const chainIdHex = numberToHex(CHAIN.id);
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainIdHex }] });
  } catch (err) {
    if ((err as { code?: number }).code !== 4902) throw err;
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainIdHex,
          chainName: CHAIN.name,
          nativeCurrency: CHAIN.nativeCurrency,
          rpcUrls: [...CHAIN.rpcUrls.default.http],
          blockExplorerUrls: [CHAIN.blockExplorers!.default.url],
        },
      ],
    });
  }
}

/** Prompts the injected wallet to connect, switches it to BNB Chain, and returns the connected address. */
export async function connectExternalWallet(): Promise<string> {
  const eth = provider();
  const [address] = await eth.request({ method: "eth_requestAccounts" });
  if (!address) throw new Error("No account was shared by your wallet.");
  await ensureBnbChain(eth);
  return address;
}

/** Returns the already-connected wallet's address, or null if nothing is connected. */
export async function getConnectedExternalAddress(): Promise<string | null> {
  try {
    const [address] = await provider().request({ method: "eth_accounts" });
    return address ?? null;
  } catch {
    return null;
  }
}

/** Signs and broadcasts the transaction with the injected wallet; returns the tx hash. */
export async function sendWithExternalWallet(tx: EvmTxRequest, address: string): Promise<Hash> {
  const eth = provider();
  await ensureBnbChain(eth);
  const accounts = await eth.request({ method: "eth_accounts" }) as string[];
  if (!accounts[0] || getAddress(accounts[0]) !== getAddress(address)) throw new Error("Wallet account changed. Reconnect before signing.");
  const client = createWalletClient({ account: address as Address, chain: CHAIN, transport: custom(eth) });
  return client.sendTransaction({ to: tx.to, data: tx.data });
}

export async function disconnectExternalWallet(): Promise<void> {
  // Not every wallet supports revoking permissions; signing Liber out locally is what matters.
  try {
    await provider().request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
  } catch {
    // ignore
  }
}

export async function signWithExternalWallet(address: string, message: string) {
  const eth = provider();
  const [active] = await eth.request({ method: "eth_accounts" });
  if (!active || getAddress(active) !== getAddress(address)) throw new Error("Wallet account changed. Reconnect to continue.");
  return createWalletClient({ transport: custom(eth) }).signMessage({ account: address as Address, message });
}
