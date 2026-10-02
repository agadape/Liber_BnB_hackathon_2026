import { createPublicClient, http, type Hash } from "viem";
import { bscTestnet } from "viem/chains";
import { ghostConfig } from "./config.js";
import { GhostChainError, readGhostState, verifyGhostProof, requireDeployedConfig, type GhostProof, type GhostAction } from "./chain.js";
import { getPool } from "../db/pool.js";
import type { GhostVoucher } from "./codec.js";
export const ghostRpc=()=>createPublicClient({chain:bscTestnet,transport:http(process.env.BSC_TESTNET_RPC_URL||bscTestnet.rpcUrls.default.http[0],{timeout:12_000,retryCount:1})});
export async function getGhost(id:Hash) {
  const config=ghostConfig();requireDeployedConfig(config);
  const state=await readGhostState(ghostRpc(),config,id);
  if(!state.storageStatus)throw new GhostChainError("UNKNOWN_VOUCHER","Voucher has not been reserved.");
  let rows:{action:GhostAction;tx_hash:Hash}[]=[];
  try { rows=(await getPool().query("SELECT action,tx_hash FROM ghost_proofs WHERE chain_id=97 AND vault_address=$1 AND voucher_id=$2 AND canonical ORDER BY block_number",[config.vaultAddress.toLowerCase(),id.toLowerCase()])).rows; } catch { /* Metadata unavailable does not change chain state. */ }
  const proofs:GhostProof[]=[];
  // Cached hashes are checked again, never treated as permanent proof of canonicality.
  for(const row of rows) {
    try { proofs.push(await verifyGhostProof(ghostRpc(),config,id,row.tx_hash,row.action)); }
    catch(e) {
      if(e instanceof GhostChainError && e.code==="PROOF_MISMATCH") await getPool().query("UPDATE ghost_proofs SET canonical=false WHERE chain_id=97 AND vault_address=$1 AND voucher_id=$2 AND action=$3",[config.vaultAddress.toLowerCase(),id.toLowerCase(),row.action]).catch(()=>{});
    }
  }
  return {...state,...config,proofs};
}
export async function proveGhost(id:Hash,hash:Hash,action:GhostAction,voucher?:GhostVoucher) {
  return verifyGhostProof(ghostRpc(),ghostConfig(),id,hash,action,voucher);
}
export async function saveGhostProof(proof:GhostProof):Promise<void> {
  const config=ghostConfig();requireDeployedConfig(config);
  const observed=await readGhostState(ghostRpc(),config,proof.voucherId);
  const client=await getPool().connect();
  try {
    await client.query("BEGIN");
    if(proof.action==="reserve" && proof.voucher) {
      const v=proof.voucher;
      await client.query(`INSERT INTO ghost_vouchers(voucher_id,chain_id,vault_address,token_address,owner_address,merchant_address,amount_raw,valid_before,salt,reserve_tx_hash,observed_status,checked_block_number,checked_block_hash,checked_block_timestamp)
        VALUES($1,97,$2,$3,$4,$5,$6,$7,$8,$9,'reserved',$10,$11,$12) ON CONFLICT(chain_id,vault_address,voucher_id) DO NOTHING`,
        [proof.voucherId.toLowerCase(),config.vaultAddress.toLowerCase(),config.tokenAddress.toLowerCase(),v.owner.toLowerCase(),v.merchant.toLowerCase(),v.amountRaw,v.validBefore,v.salt.toLowerCase(),proof.txHash.toLowerCase(),proof.blockNumber,proof.blockHash.toLowerCase(),proof.blockTimestamp]);
    }
    const found=await client.query("SELECT * FROM ghost_vouchers WHERE chain_id=97 AND vault_address=$1 AND voucher_id=$2 FOR UPDATE",[config.vaultAddress.toLowerCase(),proof.voucherId.toLowerCase()]);
    const row=found.rows[0];
    if(!row)throw new GhostChainError("RESERVATION_SYNC_REQUIRED","Sync the reservation proof before this terminal proof.");
    if(row.owner_address!==proof.owner.toLowerCase() || row.merchant_address!==proof.merchant.toLowerCase() || row.amount_raw!==proof.amountRaw || (proof.voucher && (String(row.valid_before)!==proof.voucher.validBefore || row.salt!==proof.voucher.salt.toLowerCase())))throw new GhostChainError("PROOF_MISMATCH","Stored voucher fields conflict with chain proof.");
    const current=await ghostRpc().getBlock({blockNumber:BigInt(proof.blockNumber)});
    if(current.hash!==proof.blockHash)throw new GhostChainError("PROOF_MISMATCH","Proof block changed before persistence.");
    const previous=await client.query("SELECT tx_hash FROM ghost_proofs WHERE chain_id=97 AND vault_address=$1 AND voucher_id=$2 AND action=$3 AND canonical",[config.vaultAddress.toLowerCase(),proof.voucherId.toLowerCase(),proof.action]);
    if(previous.rows[0] && previous.rows[0].tx_hash!==proof.txHash.toLowerCase())throw new GhostChainError("PROOF_MISMATCH","A different canonical proof is already recorded.");
    await client.query(`INSERT INTO ghost_proofs(chain_id,vault_address,voucher_id,action,tx_hash,log_index,block_number,block_hash,confirmations)
      VALUES(97,$1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(chain_id,vault_address,tx_hash,log_index) DO UPDATE SET canonical=true,confirmations=EXCLUDED.confirmations,verified_at=now()`,
      [config.vaultAddress.toLowerCase(),proof.voucherId.toLowerCase(),proof.action,proof.txHash.toLowerCase(),proof.logIndex,proof.blockNumber,proof.blockHash.toLowerCase(),proof.confirmations]);
    const state=observed;
    await client.query("UPDATE ghost_vouchers SET observed_status=$3,checked_block_number=$4,checked_block_hash=$5,checked_block_timestamp=$6,updated_at=now() WHERE chain_id=97 AND vault_address=$1 AND voucher_id=$2",[config.vaultAddress.toLowerCase(),proof.voucherId.toLowerCase(),state.storageStatus===2?"redeemed":state.storageStatus===3?"reclaimed":"reserved",state.checkedBlockNumber,state.checkedBlockHash.toLowerCase(),state.checkedBlockTimestamp]);
    await client.query("COMMIT");
  } catch(e) { await client.query("ROLLBACK"); throw e; }
  finally { client.release(); }
}
