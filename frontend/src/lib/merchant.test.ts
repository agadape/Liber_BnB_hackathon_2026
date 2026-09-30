import {test} from "node:test";
import assert from "node:assert/strict";
import {decodeFunctionData,type Address} from "viem";
import {prepareInvoice,invoicePaymentTx,approvalTx,selectWallet,type Invoice} from "./merchant.js";
import {invoiceAbi} from "./invoice-abi.js";
const address="0x0000000000000000000000000000000000000001" as Address;
test("explicit device-wallet selection replaces external mode and clears its session",async()=>{
  const data=new Map<string,string>([["liber:wallet:mode","external"],["liber:wallet:publicKey",address],["liber:wallet:secretKey","test-device-key"]]);let cleared=false;
  Object.defineProperty(globalThis,"window",{configurable:true,value:{localStorage:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)},sessionStorage:{removeItem:()=>{cleared=true;}}}});
  const wallet=await selectWallet(false);assert.equal(wallet.mode,"local");assert.equal(wallet.publicKey,address);assert.equal(cleared,true);assert.equal(data.get("liber:wallet:mode"),"local");
});
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
