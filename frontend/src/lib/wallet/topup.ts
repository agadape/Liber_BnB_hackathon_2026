import { encodeFunctionData, erc20Abi, parseUnits, type Address, type Hex } from "viem";

export interface EvmTxRequest {
  to: Address;
  data: Hex;
}

/** Builds an unsigned ERC-20 USDC `transfer` to the user's Kolo deposit address on BNB Chain. */
export function buildTopUpTx(params: {
  usdcAddress: Address;
  destinationAddress: Address;
  amountUsdc: string;
  decimals: number;
}): EvmTxRequest {
  return {
    to: params.usdcAddress,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [params.destinationAddress, parseUnits(params.amountUsdc, params.decimals)],
    }),
  };
}
