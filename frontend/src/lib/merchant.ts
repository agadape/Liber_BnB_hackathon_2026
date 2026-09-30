import {createPublicClient,http,encodeFunctionData,encodeAbiParameters,keccak256,parseUnits,erc20Abi,type Address,type Hash} from "viem";
import {CHAIN,RPC_URL} from "./chain";
import {invoiceAbi} from "./invoice-abi";
import {getActiveWallet,setExternalWalletMode,setLocalWalletMode,type ActiveWallet} from "./wallet/activeWallet";
import {connectExternalWallet} from "./wallet/externalWallet";
import {clearApiSession} from "./auth";
export interface MerchantConfig {chainId:number;contractAddress:Address|null;tokenAddress:Address|null;tokenDecimals:number;tokenLabel:string;testnet:boolean;copilotEnabled:boolean}
export interface Invoice extends MerchantConfig {id:Hash;merchant:Address;amountUsdc:string;amountRaw:string;expiresAt:number;paid:boolean;cancelled:boolean;payer:Address|null;status:"open"|"paid"|"cancelled"|"expired";checkedBlock:number;checkedAt:string;txHash:Hash|null;verified?:boolean;blockNumber?:number}
const api=()=>process.env.NEXT_PUBLIC_BACKEND_URL!;
async function json<T>(path:string,init?:RequestInit):Promise<T> {
  const res=await fetch(api()+path,{...init,cache:"no-store",signal:AbortSignal.timeout(25_000)});
  const body=await res.json();if(!res.ok)throw Error(body.error ?? "Request failed");return body;
}
export const getMerchantConfig=()=>json<MerchantConfig>("/config");
export const getInvoice=(id:string)=>json<Invoice>(`/invoices/${id}`);
export const verifyInvoice=(id:string,txHash:string)=>json<Invoice>(`/invoices/${id}/proof`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({txHash})});
export const publicRpc=()=>createPublicClient({chain:CHAIN,transport:http(RPC_URL)});
export async function selectWallet(external=false):Promise<ActiveWallet> {
  if(external){const publicKey=await connectExternalWallet();clearApiSession();setExternalWalletMode();return {mode:"external",publicKey};}
  clearApiSession();setLocalWalletMode();return getActiveWallet();
}
export function prepareInvoice(contract:Address,merchant:Address,amount:string,minutes:number,now=Math.floor(Date.now()/1000)) {
  if(CHAIN.id!==97 || !/^\d{1,9}(\.\d{1,2})?$/.test(amount) || parseUnits(amount,18)<=BigInt(0) || !Number.isInteger(minutes) || minutes<5 || minutes>1440)throw Error("Use a positive amount (up to 2 decimals) and an expiry of 5–1440 minutes.");
  const random=new Uint8Array(32);crypto.getRandomValues(random);
  const nonce=("0x"+Array.from(random,b=>b.toString(16).padStart(2,"0")).join("")) as Hash;
  const id=keccak256(encodeAbiParameters([{type:"uint256"},{type:"address"},{type:"address"},{type:"bytes32"}],[BigInt(97),contract,merchant,nonce]));
  const amountRaw=parseUnits(amount,18),expiresAt=BigInt(now+minutes*60);
  return {id,expiresAt:Number(expiresAt),tx:{to:contract,data:encodeFunctionData({abi:invoiceAbi,functionName:"createInvoice",args:[nonce,amountRaw,expiresAt]})}};
}
export function invoicePaymentTx(invoice:Invoice) {
  if(!invoice.contractAddress || invoice.status!=="open" || CHAIN.id!==invoice.chainId)throw Error("Invoice is not payable on this network.");
  return {to:invoice.contractAddress,data:encodeFunctionData({abi:invoiceAbi,functionName:"payInvoice",args:[invoice.id]})};
}
export function approvalTx(invoice:Invoice) {
  if(!invoice.tokenAddress || !invoice.contractAddress)throw Error("Invoice token unavailable");
  return {to:invoice.tokenAddress,data:encodeFunctionData({abi:erc20Abi,functionName:"approve",args:[invoice.contractAddress,BigInt(invoice.amountRaw)]})};
}
export const contractUrl=(address:string)=>`https://testnet.bscscan.com/address/${address}`;
