import {createPublicClient,http,getAddress,isAddress,formatUnits,decodeEventLog,erc20Abi,type Hash,type Address} from "viem";
import {bscTestnet} from "viem/chains";
import {invoiceAbi} from "./invoice-abi.js";

const client=()=>createPublicClient({chain:bscTestnet,transport:http(process.env.BSC_RPC_URL || bscTestnet.rpcUrls.default.http[0],{timeout:12_000})});
export function invoiceConfig() {
  const configured=process.env.INVOICE_CONTRACT_ADDRESS;
  return {chainId:97,contractAddress:configured && isAddress(configured) ? getAddress(configured) : null,
    tokenAddress:process.env.USDC_ADDRESS && isAddress(process.env.USDC_ADDRESS) ? getAddress(process.env.USDC_ADDRESS) : null,
    tokenDecimals:18,tokenLabel:"MockUSDC",testnet:true};
}
export async function readInvoice(id:Hash) {
  const config=invoiceConfig();
  if(!config.contractAddress || !config.tokenAddress)throw new Error("Merchant contract is not configured yet.");
  const rpc=client();
  if(await rpc.getChainId()!==97)throw new Error("Wrong RPC network");
  const [invoice,token,block]=await Promise.all([
    rpc.readContract({address:config.contractAddress,abi:invoiceAbi,functionName:"invoices",args:[id]}),
    rpc.readContract({address:config.contractAddress,abi:invoiceAbi,functionName:"token"}),rpc.getBlock()]);
  if(getAddress(token)!==config.tokenAddress)throw new Error("Unexpected invoice token");
  const [merchant,amount,expiresAt,paid,cancelled,payer]=invoice;
  if(/^0x0{40}$/i.test(merchant))return null;
  return {...config,id,merchant:getAddress(merchant),amountUsdc:formatUnits(amount,18),amountRaw:amount.toString(),expiresAt:Number(expiresAt),paid,cancelled,
    payer:paid?getAddress(payer):null,status:paid?"paid":cancelled?"cancelled":block.timestamp>=BigInt(expiresAt)?"expired":"open",checkedBlock:Number(block.number),checkedAt:new Date().toISOString()};
}
export function matchInvoiceProof(receipt:{status:string;to:string|null;logs:readonly {address:string;data:Hash;topics:readonly Hash[]}[]}, expected:{contract:Address;token:Address;id:Hash;merchant:Address;payer:Address;amount:bigint}) {
  if(receipt.status!=="success" || receipt.to?.toLowerCase()!==expected.contract.toLowerCase())return false;
  let payment=false,transfer=false;
  for(const log of receipt.logs) {
    try {
      if(log.address.toLowerCase()===expected.contract.toLowerCase()) {
        const event=decodeEventLog({abi:invoiceAbi,eventName:"InvoicePaid",data:log.data,topics:log.topics as [Hash,...Hash[]]});
        payment=event.args.id===expected.id && getAddress(event.args.merchant)===expected.merchant && getAddress(event.args.payer)===expected.payer && event.args.amount===expected.amount || payment;
      }
      if(log.address.toLowerCase()===expected.token.toLowerCase()) {
        const event=decodeEventLog({abi:erc20Abi,eventName:"Transfer",data:log.data,topics:log.topics as [Hash,...Hash[]]});
        transfer=getAddress(event.args.from)===expected.payer && getAddress(event.args.to)===expected.merchant && event.args.value===expected.amount || transfer;
      }
    }catch { /* Other events cannot prove payment. */ }
  }
  return payment && transfer;
}
export async function verifyInvoiceProof(id:Hash,txHash:Hash) {
  const invoice=await readInvoice(id);
  if(!invoice?.paid || !invoice.payer || !invoice.contractAddress || !invoice.tokenAddress)throw new Error("Invoice is not paid on chain.");
  const receipt=await client().getTransactionReceipt({hash:txHash});
  if(!matchInvoiceProof(receipt,{contract:invoice.contractAddress,token:invoice.tokenAddress,id,merchant:invoice.merchant,payer:invoice.payer,amount:BigInt(invoice.amountRaw)}))throw new Error("Receipt does not prove payment of this invoice.");
  return {...invoice,txHash,blockNumber:Number(receipt.blockNumber),verified:true};
}
