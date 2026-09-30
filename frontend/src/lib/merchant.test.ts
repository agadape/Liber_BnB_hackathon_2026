import {test} from "node:test";
import assert from "node:assert/strict";
import {decodeFunctionData,type Address} from "viem";
import {prepareInvoice,invoicePaymentTx,approvalTx,type Invoice} from "./merchant.js";
import {invoiceAbi} from "./invoice-abi.js";
const address="0x0000000000000000000000000000000000000001" as Address;
test("invoice draft locks amount and rejects invalid input",()=>{
  const draft=prepareInvoice(address,address,"5.25",60,1000);
  const decoded=decodeFunctionData({abi:invoiceAbi,data:draft.tx.data});
  assert.equal(decoded.functionName,"createInvoice");assert.equal(decoded.args?.[1],BigInt("5250000000000000000"));assert.equal(decoded.args?.[2],BigInt(4600));
  for(const amount of ["0","-1","NaN","5.555","10000000000"])assert.throws(()=>prepareInvoice(address,address,amount,60));
});
test("payment preparation rejects expired and wrong-network invoices",()=>{
  const invoice={contractAddress:address,tokenAddress:address,id:("0x"+"ab".repeat(32)),amountRaw:"5000000000000000000",status:"open",chainId:97} as Invoice;
  assert.equal(invoicePaymentTx(invoice).to,address);assert.equal(approvalTx(invoice).to,address);
  assert.throws(()=>invoicePaymentTx({...invoice,status:"expired"}));assert.throws(()=>invoicePaymentTx({...invoice,chainId:56}));
});
