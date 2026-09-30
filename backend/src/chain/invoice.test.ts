import {test} from "node:test";
import assert from "node:assert/strict";
import {encodeAbiParameters,encodeEventTopics,erc20Abi,type Address,type Hash} from "viem";
import {invoiceAbi} from "./invoice-abi.js";
import {matchInvoiceProof} from "./invoice.js";
const contract="0x0000000000000000000000000000000000000001" as Address,token="0x0000000000000000000000000000000000000002" as Address,merchant="0x0000000000000000000000000000000000000003" as Address,payer="0x0000000000000000000000000000000000000004" as Address;
const id=("0x"+"ab".repeat(32)) as Hash,amount=5n*10n**18n;
const expected={contract,token,id,merchant,payer,amount};
const payment={address:contract,data:encodeAbiParameters([{type:"uint256"}],[amount]),topics:encodeEventTopics({abi:invoiceAbi,eventName:"InvoicePaid",args:{id,merchant,payer}}) as Hash[]};
const transfer={address:token,data:encodeAbiParameters([{type:"uint256"}],[amount]),topics:encodeEventTopics({abi:erc20Abi,eventName:"Transfer",args:{from:payer,to:merchant}}) as Hash[]};
test("invoice proof requires both router payment and exact token transfer",()=>{
  const receipt={status:"success",to:contract,logs:[payment,transfer]};
  assert.equal(matchInvoiceProof(receipt,expected),true);
  for(const invalid of [{...receipt,status:"reverted"},{...receipt,to:token},{...receipt,logs:[payment]},{...receipt,logs:[transfer]},{...receipt,logs:[payment,{...transfer,address:merchant}]},{...receipt,logs:[payment,{...transfer,data:encodeAbiParameters([{type:"uint256"}],[amount-1n])}]}])assert.equal(matchInvoiceProof(invalid,expected),false);
  assert.equal(matchInvoiceProof(receipt,{...expected,id:("0x"+"cd".repeat(32)) as Hash}),false);
});
