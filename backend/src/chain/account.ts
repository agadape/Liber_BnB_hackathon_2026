import { createPublicClient, erc20Abi, formatEther, formatUnits, http, type Address } from "viem";
import { bsc, bscTestnet } from "viem/chains";

/** BNB Smart Chain: 97 = testnet (default), 56 = mainnet. */
export function chain() {
  return Number(process.env.CHAIN_ID ?? 97) === 56 ? bsc : bscTestnet;
}

export function publicClient() {
  return createPublicClient({ chain: chain(), transport: http(process.env.BSC_RPC_URL || undefined) });
}

/** USDC ERC-20 on BSC. Mainnet Binance-Peg USDC: 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d (18 decimals). */
export function usdcAddress(): Address {
  return process.env.USDC_ADDRESS as Address;
}

// Enough BNB to pay gas for a handful of ERC-20 transfers from the user's own wallet.
// (Replaces Stellar's 2 XLM base + trustline reserve; there is no trustline on EVM.)
export const ACTIVATION_BALANCE_BNB = 0.001;

export async function getNativeBalance(
  address: string,
  fetchBalance: (addr: Address) => Promise<bigint> = (addr) => publicClient().getBalance({ address: addr })
): Promise<string> {
  return formatEther(await fetchBalance(address as Address));
}

export function isActivated(nativeBalanceBnb: string | null): boolean {
  return nativeBalanceBnb !== null && Number(nativeBalanceBnb) >= ACTIVATION_BALANCE_BNB;
}

export async function loadUsdcBalance(address: string): Promise<string> {
  const client = publicClient();
  const token = usdcAddress();
  const [raw, decimals] = await Promise.all([
    client.readContract({ address: token, abi: erc20Abi, functionName: "balanceOf", args: [address as Address] }),
    client.readContract({ address: token, abi: erc20Abi, functionName: "decimals" }),
  ]);
  return formatUnits(raw, decimals);
}
