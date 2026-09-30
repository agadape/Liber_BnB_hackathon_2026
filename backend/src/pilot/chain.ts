import {createPublicClient,http,isAddress,getAddress,decodeEventLog,type Hash} from "viem";
import {bscTestnet} from "viem/chains";
import {receiptAbi} from "./receipt-abi.js";
export function registryAddress(){const address=process.env.RECEIPT_REGISTRY_ADDRESS;return address&&isAddress(address)?getAddress(address):null;}
export async function verifyRecord(commitment:Hash,txHash:Hash) {
  const address=registryAddress();if(!address)throw Error("Registry not configured");
  const rpc=createPublicClient({chain:bscTestnet,transport:http(process.env.BSC_RPC_URL||bscTestnet.rpcUrls.default.http[0],{timeout:10_000})});
  if(await rpc.getChainId()!==97)throw Error("Wrong registry network");
  const receipt=await rpc.getTransactionReceipt({hash:txHash});if(receipt.status!=="success" || receipt.to?.toLowerCase()!==address.toLowerCase())throw Error("Receipt was not recorded by this contract");
  for(const log of receipt.logs) {
    if(log.address.toLowerCase()!==address.toLowerCase())continue;
    try {const event=decodeEventLog({abi:receiptAbi,eventName:"ReceiptRecorded",data:log.data,topics:log.topics});
      if(event.args.commitment===commitment)return {recordedBy:getAddress(event.args.recorder),blockNumber:Number(receipt.blockNumber)};
    }catch { /* Unrelated events do not prove recording. */ }
  }
  throw Error("Recorded receipt hash does not match");
}
