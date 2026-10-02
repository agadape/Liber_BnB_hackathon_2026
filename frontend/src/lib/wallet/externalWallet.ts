import { createWalletClient, custom, numberToHex, getAddress, isAddress, type Address, type EIP1193Provider, type Hash } from "viem";
import { CHAIN } from "../chain";
import type { EvmTxRequest } from "./topup";
import { chooseWalletProvider, connectedProvider, forgetWalletProvider } from "./providers";
import { voucherTypedData, type GhostVoucher } from "../ghost/codec";

const ACCOUNT_HELP = "Open your wallet and unlock it. Select the account you want to use, then allow Liber to connect. In MetaMask, check this site's connected accounts and retry.";

function walletError(error: unknown): Error {
  const failure = error as { code?: number; message?: string };
  if (failure?.code === 4001) return new Error("Wallet request cancelled. Approve the connection or sign-in message to continue.");
  if (failure?.code === -32002) return new Error("A wallet request is already waiting. Open your wallet extension and complete or cancel it before retrying.");
  if (failure?.code === 4100 || /at least one account|no account|locked|unauthorized/i.test(failure?.message ?? "")) return new Error(ACCOUNT_HELP);
  return new Error("Your wallet could not complete the request. Open the wallet, check its connection to Liber, and try again.");
}

async function account(eth: EIP1193Provider, request = false): Promise<Address> {
  let accounts: unknown;
  try { accounts = await eth.request({ method: request ? "eth_requestAccounts" : "eth_accounts" }); }
  catch (error) { throw walletError(error); }
  if (!Array.isArray(accounts) || typeof accounts[0] !== "string" || !isAddress(accounts[0])) throw new Error(ACCOUNT_HELP);
  return getAddress(accounts[0]);
}

async function ensureBnbChain(eth: EIP1193Provider): Promise<void> {
  const chainIdHex = numberToHex(CHAIN.id);
  try {
    if (Number(await eth.request({ method: "eth_chainId" })) === CHAIN.id) return;
    try { await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainIdHex }] }); }
    catch (error) {
      if ((error as { code?: number }).code !== 4902) throw error;
      await eth.request({ method: "wallet_addEthereumChain", params: [{
        chainId: chainIdHex, chainName: CHAIN.name, nativeCurrency: CHAIN.nativeCurrency,
        rpcUrls: [...CHAIN.rpcUrls.default.http], blockExplorerUrls: [CHAIN.blockExplorers!.default.url],
      }] });
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainIdHex }] });
    }
    if (Number(await eth.request({ method: "eth_chainId" })) !== CHAIN.id)
      throw new Error(`Switch your wallet to ${CHAIN.name}, then reconnect.`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Switch your wallet")) throw error;
    throw walletError(error);
  }
}

export async function connectExternalWallet(): Promise<string> {
  const eth = await chooseWalletProvider();
  const address = await account(eth, true);
  await ensureBnbChain(eth);
  if (await account(eth) !== address) throw new Error("Wallet account changed while connecting. Select your account and reconnect.");
  return address;
}

export async function getConnectedExternalAddress(): Promise<string | null> {
  try { return await account(await connectedProvider()); } catch { return null; }
}

export async function sendWithExternalWallet(tx: EvmTxRequest, address: string): Promise<Hash> {
  const eth = await connectedProvider();
  await ensureBnbChain(eth);
  if (await account(eth) !== getAddress(address)) throw new Error("Wallet account changed. Reconnect before signing.");
  return createWalletClient({ account: address as Address, chain: CHAIN, transport: custom(eth) }).sendTransaction({ to: tx.to, data: tx.data });
}

export async function disconnectExternalWallet(): Promise<void> {
  try { await (await connectedProvider()).request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] }); }
  catch { /* Some wallets do not support revoking permissions. */ }
  finally { forgetWalletProvider(); }
}

export async function signWithExternalWallet(address: string, message: string) {
  const eth = await connectedProvider();
  if (await account(eth) !== getAddress(address)) throw new Error("Wallet account changed. Reconnect to continue.");
  try { return await createWalletClient({ transport: custom(eth) }).signMessage({ account: address as Address, message }); }
  catch (error) { throw walletError(error); }
}

export async function signGhostWithExternalWallet(address:string,vault:Address,voucher:GhostVoucher) {
  const eth=await connectedProvider();await ensureBnbChain(eth);
  if(CHAIN.id!==97 || await account(eth)!==getAddress(address) || getAddress(address)!==voucher.owner)throw Error("Reconnect the voucher owner on BSC Testnet.");
  try {
    const signature=await createWalletClient({chain:CHAIN,transport:custom(eth)}).signTypedData({account:address as Address,...voucherTypedData(vault,voucher)});
    if(await account(eth)!==getAddress(address))throw Error("Wallet changed while signing. Review the voucher again.");
    return signature;
  }catch(error){throw walletError(error);}
}
