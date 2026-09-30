import {createHash,timingSafeEqual} from "node:crypto";
import {getAddress,isAddress} from "viem";
export type Mode="sandbox"|"production";
export type GatewayStatus="pending"|"settlement"|"expire"|"deny"|"cancel"|"failure"|"partial_refund"|"refund";
export function pilotConfig() {
  const mode:Mode=process.env.MIDTRANS_MODE==="production"?"production":"sandbox";
  const owner=process.env.PILOT_MERCHANT_WALLET;
  const max=Number(process.env.PILOT_MAX_AMOUNT_IDR??100000);
  const ready=process.env.PILOT_ENABLED==="true" && !!process.env.MIDTRANS_SERVER_KEY && !!process.env.MIDTRANS_MERCHANT_ID && !!owner && isAddress(owner) && !!process.env.PILOT_MERCHANT_NAME && (mode!=="production" || process.env.MIDTRANS_LIVE_CONFIRMED==="true");
  return {mode,ready,merchantName:process.env.PILOT_MERCHANT_NAME||"Liber pilot merchant",owner:owner&&isAddress(owner)?getAddress(owner):null,maxAmountIdr:Number.isInteger(max)&&max>=1000&&max<=10000000?max:100000};
}
export class ProviderError extends Error {constructor(public code:number){super("Payment provider unavailable. Retry status before creating another invoice.");}}
export function providerOrigin(mode:Mode){return mode==="production"?"https://api.midtrans.com":"https://api.sandbox.midtrans.com";}
export function validSignature(body:Record<string,unknown>,key:string) {
  if(![body.order_id,body.status_code,body.gross_amount,body.signature_key].every(v=>typeof v==="string") || !/^[a-fA-F0-9]{128}$/.test(body.signature_key as string))return false;
  const expected=createHash("sha512").update(`${body.order_id}${body.status_code}${body.gross_amount}${key}`).digest();
  return timingSafeEqual(expected,Buffer.from(body.signature_key as string,"hex"));
}
export interface ProviderOrder {orderId:string;amountIdr:number;transactionId:string|null}
export interface CheckedStatus {status:GatewayStatus;transactionId:string;qrUrl:string}
export function checkedStatus(body:Record<string,unknown>,order:ProviderOrder,merchantId:string,mode:Mode):CheckedStatus {
  const status=body.transaction_status as GatewayStatus;
  if(body.order_id!==order.orderId || body.merchant_id!==merchantId || body.payment_type!=="qris" || body.currency!=="IDR" ||
    typeof body.gross_amount!=="string" || !/^\d{1,10}(?:\.00)?$/.test(body.gross_amount) || Number(body.gross_amount)!==order.amountIdr ||
    typeof body.transaction_id!=="string" || !/^[a-zA-Z0-9-]{1,100}$/.test(body.transaction_id) || (order.transactionId && order.transactionId!==body.transaction_id) ||
    !["pending","settlement","expire","deny","cancel","failure","partial_refund","refund"].includes(status))throw Error("Provider response does not match the invoice.");
  if(["settlement","partial_refund","refund"].includes(status) && (body.status_code!=="200" || (body.fraud_status!==undefined && body.fraud_status!=="accept")))throw Error("Provider has not confirmed an accepted payment.");
  return {status,transactionId:body.transaction_id,qrUrl:`${providerOrigin(mode)}/v2/qris/${body.transaction_id}/qr-code`};
}
const rank:Record<string,number>={creating:0,pending:1,expire:2,deny:2,cancel:2,failure:2,settlement:3,partial_refund:4,refund:5};
export const acceptsStatus=(previous:string,next:GatewayStatus)=>rank[next]>= (rank[previous]??0);
export class Midtrans {
  constructor(readonly mode:Mode,private key:string,private fetchImpl:typeof fetch=fetch){}
  private async request(path:string,init:RequestInit={}) {
    const res=await this.fetchImpl(providerOrigin(this.mode)+path,{...init,redirect:"error",signal:AbortSignal.timeout(10_000),headers:{Accept:"application/json","Content-Type":"application/json",Authorization:`Basic ${Buffer.from(this.key+":").toString("base64")}`,...init.headers}});
    if(!res.ok)throw new ProviderError(res.status);
    const body=await res.json();if(!["200","201"].includes(body.status_code))throw new ProviderError(Number(body.status_code)||503);return body as Record<string,unknown>;
  }
  charge(order:ProviderOrder){return this.request("/v2/charge",{method:"POST",body:JSON.stringify({payment_type:"qris",transaction_details:{order_id:order.orderId,gross_amount:order.amountIdr},qris:{acquirer:"gopay"}})});}
  status(orderId:string){return this.request(`/v2/${encodeURIComponent(orderId)}/status`);}
  async qr(transactionId:string) {
    if(!/^[a-zA-Z0-9-]{1,100}$/.test(transactionId))throw Error("Invalid QR reference");
    const res=await this.fetchImpl(`${providerOrigin(this.mode)}/v2/qris/${transactionId}/qr-code`,{redirect:"error",signal:AbortSignal.timeout(10_000),headers:{Authorization:`Basic ${Buffer.from(this.key+":").toString("base64")}`}});
    if(!res.ok || !res.headers.get("content-type")?.startsWith("image/png"))throw new ProviderError(res.status);
    const data=await res.arrayBuffer();if(data.byteLength>512000)throw Error("Unexpected QR image size");return data;
  }
}
