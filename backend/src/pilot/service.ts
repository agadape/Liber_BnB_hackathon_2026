import {randomUUID} from "node:crypto";
import {getPool} from "../db/pool.js";
import {Midtrans,ProviderError,checkedStatus,acceptsStatus,pilotConfig,type Mode,type GatewayStatus} from "./provider.js";
import {receiptCommitment,type ReceiptStatement} from "./receipt.js";
export interface OrderRow {id:string;owner_address:string;idempotency_key:string;environment:Mode;merchant_name:string;provider_order_id:string;provider_merchant_id:string;amount_idr:number;status:string;provider_transaction_id:string|null;charge_claimed_at:Date|null;provider_checked_at:Date|null;created_at:Date}
export interface Gateway {charge(order:{orderId:string;amountIdr:number;transactionId:string|null}):Promise<Record<string,unknown>>;status(id:string):Promise<Record<string,unknown>>;qr(id:string):Promise<ArrayBuffer>}
const gateway=()=>new Midtrans(pilotConfig().mode,process.env.MIDTRANS_SERVER_KEY!);
export const findOrder=async(id:string)=>(await getPool().query<OrderRow>("SELECT * FROM pilot_orders WHERE id=$1",[id])).rows[0];
export const findProviderOrder=async(id:string)=>(await getPool().query<OrderRow>("SELECT * FROM pilot_orders WHERE provider_order_id=$1",[id])).rows[0];
export async function publicOrder(order:OrderRow) {
  const receipts=await getPool().query("SELECT id,commitment,statement,chain_tx_hash,recorded_by FROM pilot_receipts WHERE order_id=$1 ORDER BY created_at DESC",[order.id]);
  return {id:order.id,merchantName:order.merchant_name,environment:order.environment,amountIdr:order.amount_idr,currency:"IDR",status:order.status,
    paymentConfirmed:["settlement","partial_refund","refund"].includes(order.status),currentlyPaid:order.status==="settlement",providerCheckedAt:order.provider_checked_at?.toISOString()??null,
    createdAt:order.created_at.toISOString(),hasQr:order.status==="pending"&&!!order.provider_transaction_id,receipts:receipts.rows.map(r=>({id:r.id,commitment:r.commitment,statement:r.statement,txHash:r.chain_tx_hash,recordedBy:r.recorded_by}))};
}
function requireConnection(order?:OrderRow) {
  const config=pilotConfig();
  if(!config.ready || (order && (order.environment!==config.mode || order.provider_merchant_id!==process.env.MIDTRANS_MERCHANT_ID)))throw Error("Payment provider connection is not active for this invoice.");
  return config;
}
async function applyStatus(order:OrderRow,raw:Record<string,unknown>) {
  const checked=checkedStatus(raw,{orderId:order.provider_order_id,amountIdr:order.amount_idr,transactionId:order.provider_transaction_id},order.provider_merchant_id,order.environment);
  const client=await getPool().connect();
  try {
    await client.query("BEGIN");
    const current=(await client.query<OrderRow>("SELECT * FROM pilot_orders WHERE id=$1 FOR UPDATE",[order.id])).rows[0];
    if(acceptsStatus(current.status,checked.status)) {
      // Bind transaction ID again under lock: concurrent provider responses cannot change it.
      if(current.provider_transaction_id && current.provider_transaction_id!==checked.transactionId)throw Error("Transaction identity changed");
      await client.query("UPDATE pilot_orders SET status=$2,provider_transaction_id=$3,provider_checked_at=now() WHERE id=$1",[order.id,checked.status,checked.transactionId]);
      if(["settlement","partial_refund","refund"].includes(checked.status)) {
        const statement:ReceiptStatement={version:1,provider:"midtrans",environment:order.environment,orderRef:order.id,receiptRef:randomUUID(),amountIdr:order.amount_idr,currency:"IDR",status:checked.status as ReceiptStatement["status"],observedAt:new Date().toISOString()};
        await client.query("INSERT INTO pilot_receipts(id,order_id,provider_status,commitment,statement) VALUES($1,$2,$3,$4,$5) ON CONFLICT(order_id,provider_status) DO NOTHING",[statement.receiptRef,order.id,checked.status,receiptCommitment(statement),JSON.stringify(statement)]);
      }
    }
    await client.query("COMMIT");
  }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
  return (await findOrder(order.id))!;
}
export async function createOrder(owner:string,amountIdr:number,key:string,api:Gateway=gateway()) {
  const config=requireConnection();if(owner!==config.owner)throw Error("Only the configured pilot merchant may create invoices.");
  const client=await getPool().connect();let order:OrderRow;
  try {
    await client.query("BEGIN");await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[owner]);
    const existing=(await client.query<OrderRow>("SELECT * FROM pilot_orders WHERE owner_address=$1 AND idempotency_key=$2",[owner,key])).rows[0];
    if(existing){if(existing.amount_idr!==amountIdr || existing.environment!==config.mode)throw Error("An invoice retry must use the original amount and environment.");order=existing;}
    else {
      const count=(await client.query("SELECT count(*)::int AS count FROM pilot_orders WHERE owner_address=$1 AND created_at>=date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'",[owner])).rows[0].count;
      if(count>=100)throw Error("Pilot invoice daily limit reached.");
      const id=randomUUID();order=(await client.query<OrderRow>("INSERT INTO pilot_orders(id,owner_address,idempotency_key,environment,merchant_name,provider_order_id,provider_merchant_id,amount_idr) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",[id,owner,key,config.mode,config.merchantName,`lp-${config.mode==="production"?"p":"s"}-${id}`,process.env.MIDTRANS_MERCHANT_ID,amountIdr])).rows[0];
    }
    await client.query("COMMIT");
  }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
  requireConnection(order);
  if(order.status!=="creating")return order;
  const claimed=await getPool().query("UPDATE pilot_orders SET charge_claimed_at=now() WHERE id=$1 AND (charge_claimed_at IS NULL OR charge_claimed_at<now()-interval '30 seconds') RETURNING id",[order.id]);
  if(!claimed.rowCount)return order;
  try {
    let raw:Record<string,unknown>;
    if(order.charge_claimed_at) {
      try {raw=await api.status(order.provider_order_id);}catch(e){if(!(e instanceof ProviderError) || e.code!==404)throw e;raw=await api.charge({orderId:order.provider_order_id,amountIdr,transactionId:null});}
    }else raw=await api.charge({orderId:order.provider_order_id,amountIdr,transactionId:null});
    return await applyStatus(order,raw);
  }catch {return (await findOrder(order.id))!;} // Unknown charge outcome keeps the same order ID for safe retry.
}
export async function refreshOrder(order:OrderRow,api:Gateway=gateway(),force=false) {
  requireConnection(order);
  const claim=await getPool().query("UPDATE pilot_orders SET check_claimed_at=now() WHERE id=$1 AND (check_claimed_at IS NULL OR check_claimed_at<now()-($2::int * interval '1 second')) RETURNING id",[order.id,force?3:15]);
  if(!claim.rowCount){if(force)throw Error("Status check in progress; retry notification.");return (await findOrder(order.id))!;}
  return applyStatus(order,await api.status(order.provider_order_id));
}
export {gateway as currentGateway};
