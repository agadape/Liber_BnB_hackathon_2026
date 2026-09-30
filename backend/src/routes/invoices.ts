import {Hono} from "hono";
import {bodyLimit} from "hono/body-limit";
import type {Hash} from "viem";
import {invoiceConfig,readInvoice,verifyInvoiceProof} from "../chain/invoice.js";
import {getPool} from "../db/pool.js";
const hashPattern=/^0x[a-fA-F0-9]{64}$/;
export function createInvoicesRoute(read=readInvoice,verify=verifyInvoiceProof) {
  const route=new Hono();
  route.use("/invoices/*",bodyLimit({maxSize:1024}));
  route.get("/config",c=>c.json({...invoiceConfig(),copilotEnabled:process.env.COPILOT_ENABLED==="true"}));
  route.get("/invoices/:id",async c=>{
    const id=c.req.param("id"); if(!hashPattern.test(id))return c.json({error:"Invalid invoice ID"},400);
    try {
      const invoice=await read(id.toLowerCase() as Hash); if(!invoice)return c.json({error:"Invoice not found"},404);
      const result=await getPool().query("SELECT tx_hash FROM invoice_receipts WHERE invoice_id=$1",[id.toLowerCase()]);
      c.header("Cache-Control","no-store");
      return c.json({...invoice,txHash:invoice.paid?result.rows[0]?.tx_hash ?? null:null});
    }catch {return c.json({error:"Invoice could not be checked on BSC Testnet. Try again."},503);}
  });
  route.post("/invoices/:id/proof",async c=>{
    const id=c.req.param("id"),body=await c.req.json().catch(()=>null);
    if(!hashPattern.test(id) || !hashPattern.test(body?.txHash ?? ""))return c.json({error:"Invalid invoice ID or transaction hash"},400);
    try {
      const proof=await verify(id.toLowerCase() as Hash,body.txHash.toLowerCase() as Hash);
      await getPool().query("INSERT INTO invoice_receipts(invoice_id,tx_hash,chain_id) VALUES($1,$2,97) ON CONFLICT(invoice_id) DO NOTHING",[id.toLowerCase(),proof.txHash]);
      return c.json(proof);
    }catch {return c.json({error:"Payment proof is not confirmed or does not match this invoice."},409);}
  });
  return route;
}
