import {keccak256,toHex,type Hash} from "viem";
import type {Mode} from "./provider.js";
export interface ReceiptStatement {version:1;provider:"midtrans";environment:Mode;orderRef:string;receiptRef:string;amountIdr:number;currency:"IDR";status:"settlement"|"partial_refund"|"refund";observedAt:string}
export function receiptCommitment(s:ReceiptStatement):Hash {
  // Fixed field order makes a portable hash; database JSON key ordering is irrelevant.
  return keccak256(toHex(JSON.stringify({version:s.version,provider:s.provider,environment:s.environment,orderRef:s.orderRef,receiptRef:s.receiptRef,amountIdr:s.amountIdr,currency:s.currency,status:s.status,observedAt:s.observedAt})));
}
