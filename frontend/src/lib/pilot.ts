import {keccak256,toHex,type Address,type Hash} from "viem";
import {authenticatedFetch} from "./auth";
export interface PilotConfig {enabled:boolean;environment:"sandbox"|"production";merchantName:string;maxAmountIdr:number;registryAddress:Address|null;registryChainId:number}
export interface Statement {version:1;provider:"midtrans";environment:"sandbox"|"production";orderRef:string;receiptRef:string;amountIdr:number;currency:"IDR";status:"settlement"|"partial_refund"|"refund";observedAt:string}
export interface PilotReceipt {id:string;commitment:Hash;statement:Statement;txHash:Hash|null;recordedBy:Address|null}
export interface PilotOrder {id:string;merchantName:string;environment:"sandbox"|"production";amountIdr:number;currency:"IDR";status:string;paymentConfirmed:boolean;currentlyPaid:boolean;providerCheckedAt:string|null;createdAt:string;hasQr:boolean;receipts:PilotReceipt[]}
export const validPilotId=(id:string)=>/^[a-fA-F0-9]{8}(-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}$/.test(id);
export const pilotApi=(path:string)=>process.env.NEXT_PUBLIC_BACKEND_URL+"/pilot"+path;
async function request<T>(path:string,init?:RequestInit,merchant=false):Promise<T>{const res=await (merchant?authenticatedFetch:fetch)(pilotApi(path),{...init,cache:"no-store",signal:AbortSignal.timeout(25000)});const data=await res.json();if(!res.ok)throw Error(data.error??"Could not load invoice");return data;}
export const getPilotConfig=()=>request<PilotConfig>("/config");
export const getPilotOrder=(id:string)=>request<PilotOrder>(`/orders/${id}`);
export const refreshPilotOrder=(id:string)=>request<PilotOrder>(`/orders/${id}/refresh`,{method:"POST"});
export const getPilotOrders=()=>request<{orders:PilotOrder[]}>("/merchant/orders",undefined,true);
export const createPilotOrder=(amountIdr:number,key:string)=>request<PilotOrder>("/orders",{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":key},body:JSON.stringify({amountIdr})},true);
export const verifyPilotRecord=(orderId:string,receiptId:string,txHash:string)=>request<{recorded:boolean}>(`/orders/${orderId}/receipts/${receiptId}/proof`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({txHash})});
export const rupiah=(value:number)=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(value);
export const pilotStatus=(status:string)=>({creating:"Connecting to payment provider",pending:"Awaiting QRIS payment",settlement:"Payment confirmed by Midtrans",expire:"Invoice expired",deny:"Payment denied",cancel:"Invoice cancelled",failure:"Payment failed",refund:"Refund reported by Midtrans",partial_refund:"Partial refund reported by Midtrans"}[status]??"Status unavailable");
export function receiptCommitment(s:Statement):Hash{return keccak256(toHex(JSON.stringify({version:s.version,provider:s.provider,environment:s.environment,orderRef:s.orderRef,receiptRef:s.receiptRef,amountIdr:s.amountIdr,currency:s.currency,status:s.status,observedAt:s.observedAt})));}
