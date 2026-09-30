import {Hono} from "hono";
import {bodyLimit} from "hono/body-limit";
import type {Hash} from "viem";
import {requireWallet,type AuthEnv} from "../auth/auth.js";
import {getPool} from "../db/pool.js";
import {pilotConfig,validSignature} from "../pilot/provider.js";
import {findOrder,findProviderOrder,publicOrder,createOrder,refreshOrder,currentGateway,type Gateway} from "../pilot/service.js";
import {registryAddress,verifyRecord} from "../pilot/chain.js";
const uuid=/^[a-fA-F0-9]{8}(-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}$/;
const hash=/^0x[a-fA-F0-9]{64}$/;
export function createPilotRoute(api?:Gateway,verify=verifyRecord) {
  const route=new Hono<AuthEnv>();
  route.use("/pilot/*",bodyLimit({maxSize:16384}));
  route.use("/pilot/*",async(c,next)=>{c.header("Cache-Control","no-store");await next();});
  route.get("/pilot/config",c=>{const p=pilotConfig();return c.json({enabled:p.ready,environment:p.mode,merchantName:p.merchantName,maxAmountIdr:p.maxAmountIdr,registryAddress:registryAddress(),registryChainId:97});});
  route.get("/pilot/merchant/orders",requireWallet,async c=>{
    if(c.get("walletAddress")!==pilotConfig().owner)return c.json({error:"This wallet is not the pilot merchant."},403);
    const rows=await getPool().query("SELECT * FROM pilot_orders WHERE owner_address=$1 ORDER BY created_at DESC LIMIT 30",[c.get("walletAddress")]);
    return c.json({orders:await Promise.all(rows.rows.map(publicOrder))});
  });
  route.post("/pilot/orders",requireWallet,async c=>{
    const p=pilotConfig();if(!p.ready)return c.json({error:"QRIS pilot is not connected to Midtrans yet."},503);
    if(c.get("walletAddress")!==p.owner)return c.json({error:"Only the configured pilot merchant can create invoices."},403);
    const body=await c.req.json().catch(()=>null),key=c.req.header("Idempotency-Key")??"";
    if(!uuid.test(key) || !Number.isInteger(body?.amountIdr) || body.amountIdr<1000 || body.amountIdr>p.maxAmountIdr)return c.json({error:`Use a whole-rupiah amount between 1,000 and ${p.maxAmountIdr}, with an invoice retry key.`},400);
    try {const order=await createOrder(c.get("walletAddress"),body.amountIdr,key,api);return c.json(await publicOrder(order),order.status==="creating"?202:200);}
    catch(e){return c.json({error:e instanceof Error?e.message:"Could not create invoice"},409);}
  });
  route.get("/pilot/orders/:id",async c=>{
    if(!uuid.test(c.req.param("id")))return c.json({error:"Invalid invoice link"},400);
    const order=await findOrder(c.req.param("id"));if(!order)return c.json({error:"Invoice not found"},404);
    return c.json(await publicOrder(order));
  });
  route.post("/pilot/orders/:id/refresh",async c=>{
    if(!uuid.test(c.req.param("id")))return c.json({error:"Invalid invoice link"},400);
    const order=await findOrder(c.req.param("id"));if(!order)return c.json({error:"Invoice not found"},404);
    try {return c.json(await publicOrder(await refreshOrder(order,api)));}catch{return c.json({error:"Could not refresh from Midtrans. The last checked status is not a new confirmation."},503);}
  });
  route.get("/pilot/orders/:id/qr",async c=>{
    if(!uuid.test(c.req.param("id")))return c.json({error:"Invalid invoice link"},400);
    const order=await findOrder(c.req.param("id"));if(!order || order.status!=="pending" || !order.provider_transaction_id)return c.json({error:"No payable QR is available"},409);
    if(!pilotConfig().ready || order.environment!==pilotConfig().mode || order.provider_merchant_id!==process.env.MIDTRANS_MERCHANT_ID)return c.json({error:"Provider connection unavailable"},503);
    try {const image=await (api??currentGateway()).qr(order.provider_transaction_id);c.header("Content-Type","image/png");return c.body(image);}catch{return c.json({error:"Provider QR could not be loaded. Refresh invoice status before paying."},503);}
  });
  route.post("/pilot/midtrans/notification",async c=>{
    const body=await c.req.json().catch(()=>null);
    if(!body || typeof body!=="object" || !process.env.MIDTRANS_SERVER_KEY || !validSignature(body,process.env.MIDTRANS_SERVER_KEY))return c.json({error:"Invalid notification signature"},401);
    const order=await findProviderOrder(body.order_id);if(!order)return c.json({error:"Unknown invoice"},404);
    try {await refreshOrder(order,api,true);return c.json({received:true});}catch{return c.json({error:"Provider confirmation unavailable. Retry notification."},503);}
  });
  route.post("/pilot/orders/:id/receipts/:receiptId/proof",async c=>{
    const id=c.req.param("id"),receiptId=c.req.param("receiptId"),body=await c.req.json().catch(()=>null);
    if(!uuid.test(id)||!uuid.test(receiptId)||!hash.test(body?.txHash??""))return c.json({error:"Invalid receipt proof"},400);
    const row=(await getPool().query("SELECT commitment,statement FROM pilot_receipts WHERE id=$1 AND order_id=$2",[receiptId,id])).rows[0];
    if(!row)return c.json({error:"Verified provider receipt not found"},404);
    try {const proof=await verify(row.commitment as Hash,body.txHash as Hash);
      await getPool().query("UPDATE pilot_receipts SET chain_tx_hash=$2,recorded_by=$3 WHERE id=$1",[receiptId,body.txHash.toLowerCase(),proof.recordedBy]);
      return c.json({recorded:true,...proof});
    }catch{return c.json({error:"Chain transaction does not record this receipt hash and environment."},409);}
  });
  return route;
}
