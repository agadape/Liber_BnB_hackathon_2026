import { bsc, bscTestnet } from "viem/chains";
import type { Address } from "viem";

/** BNB Smart Chain: 97 = testnet (default), 56 = mainnet. */
export const CHAIN = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 97) === 56 ? bsc : bscTestnet;
export const IS_TESTNET = CHAIN.id === 97;
export const TOKEN_LABEL = IS_TESTNET ? "MockUSDC" : "USDC";

export const RPC_URL = process.env.NEXT_PUBLIC_BSC_RPC_URL || CHAIN.rpcUrls.default.http[0];

/** USDC ERC-20 on BSC (18 decimals). Mainnet Binance-Peg USDC: 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d. */
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "") as Address;
export const USDC_DECIMALS = Number(process.env.NEXT_PUBLIC_USDC_DECIMALS ?? 18);

/** Minimum BNB the wallet needs for gas before the backend will register it (mirrors backend ACTIVATION_BALANCE_BNB). */
export const ACTIVATION_BALANCE_BNB = 0.001;

export function explorerTxUrl(hash: string): string {
  return `${CHAIN.blockExplorers!.default.url}/tx/${hash}`;
}
