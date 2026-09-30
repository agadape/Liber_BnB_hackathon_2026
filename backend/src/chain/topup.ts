import { createPublicClient, http, erc20Abi, parseEventLogs, formatUnits, getAddress, type Address, type Hash, type TransactionReceipt } from "viem";
import { chain } from "./account.js";

export class InvalidTopupError extends Error {}

export function readVerifiedTransfer(receipt: TransactionReceipt, token: Address, sender: Address, destination: Address, decimals: number): string {
  if (receipt.status !== "success" || receipt.from.toLowerCase() !== sender.toLowerCase() || receipt.to?.toLowerCase() !== token.toLowerCase())
    throw new InvalidTopupError("Transaction must be a successful transfer from your wallet to the configured token contract");
  const transfers = parseEventLogs({ abi: erc20Abi, eventName: "Transfer", strict: true,
    logs: receipt.logs.filter(log => log.address.toLowerCase() === token.toLowerCase()) });
  const matches = transfers.filter(log => log.args.from.toLowerCase() === sender.toLowerCase() &&
    log.args.to.toLowerCase() === destination.toLowerCase() && log.args.value > 0n);
  if (matches.length !== 1) throw new InvalidTopupError("No matching token transfer to your saved destination");
  return formatUnits(matches[0].args.value, decimals);
}

export async function verifyTopup(params: { txHash: Hash; sender: Address; destination: Address }) {
  const token = process.env.USDC_ADDRESS;
  if (!token) throw new Error("Token contract is not configured");
  const tokenAddress = getAddress(token);
  const client = createPublicClient({ chain: chain(), transport: http(process.env.BSC_RPC_URL || undefined) });
  if (await client.getChainId() !== chain().id) throw new Error("RPC network does not match the configured chain");
  const [receipt, decimals] = await Promise.all([
    client.getTransactionReceipt({ hash: params.txHash }),
    client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "decimals" }),
  ]);
  return { amountUsdc: readVerifiedTransfer(receipt, tokenAddress, params.sender, params.destination, decimals),
    chainId: chain().id, tokenAddress };
}
