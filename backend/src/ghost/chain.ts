// Canonical shared chain verifier; generated into both apps.
import { decodeEventLog, erc20Abi, getAddress, type Address, type Hash, type PublicClient } from "viem";
import { GHOST } from "./protocol.js";
import { ghostAbi } from "./ghost-abi.js";
import { hashPattern, voucherId, validateVoucher, type GhostVoucher } from "./codec.js";

export interface GhostConfig { enabled: boolean; chainId: number; vaultAddress: Address|null; tokenAddress: Address|null; tokenDecimals: number; deploymentBlock: string|null; confirmationsRequired: number; tokenLabel: "MockUSDC"; testnet: true; reason: string|null }
export interface ReadyGhostConfig extends GhostConfig { vaultAddress: Address; tokenAddress: Address; deploymentBlock: string }
export type GhostAction = "reserve"|"redeem"|"reclaim";
export type GhostEffectiveStatus = "unknown"|"reserved"|"expired_reclaimable"|"redeemed"|"reclaimed";
export class GhostChainError extends Error { constructor(public code: string, message: string) { super(message); this.name="GhostChainError"; } }
export interface GhostState {
  voucherId: Hash; owner: Address; merchant: Address; amountRaw: string; validBefore: string;
  storageStatus: number; effectiveStatus: GhostEffectiveStatus;
  checkedBlockNumber: string; checkedBlockHash: Hash; checkedBlockTimestamp: string;
}
export interface GhostProof {
  voucherId: Hash; action: GhostAction; txHash: Hash; logIndex: number;
  blockNumber: string; blockHash: Hash; blockTimestamp: string; confirmations: number;
  owner: Address; merchant: Address; amountRaw: string; verified: true;
  scope: "reservationProof"|"redemptionProof"|"reclaimProof";
  voucher?: {owner:Address;merchant:Address;amountRaw:string;validBefore:string;salt:Hash};
}
export function requireReadyConfig(config: GhostConfig): asserts config is ReadyGhostConfig {
  requireDeployedConfig(config);
  if(!config.enabled)throw new GhostChainError("GHOST_DISABLED",config.reason ?? "Ghost issuance is disabled.");
}
export function requireDeployedConfig(config: GhostConfig): asserts config is ReadyGhostConfig {
  if(config.chainId!==97 || !config.vaultAddress || !config.tokenAddress || !config.deploymentBlock || !/^\d+$/.test(config.deploymentBlock) || config.tokenDecimals!==18 || !Number.isInteger(config.confirmationsRequired) || config.confirmationsRequired<12) throw new GhostChainError("GHOST_DISABLED","Ghost deployment is not configured on BSC Testnet.");
}
const equal=(a:string,b:string)=>a.toLowerCase()===b.toLowerCase();
export function effectiveStatus(status:number,validBefore:bigint,timestamp:bigint): GhostEffectiveStatus {
  return status===0?"unknown":status===2?"redeemed":status===3?"reclaimed":timestamp>=validBefore?"expired_reclaimable":"reserved";
}
export async function assertGhostDeployment(client: PublicClient, config: GhostConfig): Promise<void> {
  requireDeployedConfig(config);
  const [chain,vaultCode,tokenCode,token,decimals,domain]=await Promise.all([
    client.getChainId(),client.getCode({address:config.vaultAddress}),client.getCode({address:config.tokenAddress}),
    client.readContract({address:config.vaultAddress,abi:ghostAbi,functionName:"token"}),
    client.readContract({address:config.tokenAddress,abi:erc20Abi,functionName:"decimals"}),
    client.readContract({address:config.vaultAddress,abi:ghostAbi,functionName:"eip712Domain"}),
  ]);
  if(chain!==97 || !vaultCode || vaultCode==="0x" || !tokenCode || tokenCode==="0x" || !equal(token,config.tokenAddress) || decimals!==18 || domain[0]!=="0x0f" || domain[1]!==GHOST.domainName || domain[2]!==GHOST.domainVersion || domain[3]!==97n || !equal(domain[4],config.vaultAddress) || domain[6].length!==0) throw new GhostChainError("CONFIG_MISMATCH","Ghost vault, token, or signing domain does not match this deployment.");
}
export async function freshHead(client:PublicClient,now=Math.floor(Date.now()/1000)) {
  const block=await client.getBlock({blockTag:"latest"});
  if(!block.hash || block.number===null || block.timestamp<BigInt(now-GHOST.headMaxAgeSeconds) || block.timestamp>BigInt(now+30)) throw new GhostChainError("RPC_UNAVAILABLE","Chain time could not be verified. Reconnect before using this voucher.");
  return block;
}
export async function readGhostState(client:PublicClient, config:GhostConfig, id:Hash):Promise<GhostState> {
  requireDeployedConfig(config); if(!hashPattern.test(id)) throw new GhostChainError("MALFORMED_INPUT","Invalid voucher ID.");
  await assertGhostDeployment(client,config);
  const head=await freshHead(client);
  const [owner,merchant,amount,validBefore,status]=await client.readContract({address:config.vaultAddress,abi:ghostAbi,functionName:"reservations",args:[id],blockNumber:head.number});
  if(status>3) throw new GhostChainError("CONFIG_MISMATCH","Unsupported voucher state.");
  return {voucherId:id,owner:getAddress(owner),merchant:getAddress(merchant),amountRaw:amount.toString(),validBefore:validBefore.toString(),storageStatus:status,effectiveStatus:effectiveStatus(status,validBefore,head.timestamp),checkedBlockNumber:head.number.toString(),checkedBlockHash:head.hash!,checkedBlockTimestamp:head.timestamp.toString()};
}
export function assertReservationMatches(state:GhostState, voucher:GhostVoucher,config:GhostConfig):void {
  requireDeployedConfig(config); validateVoucher(voucher,config.vaultAddress);
  if(state.voucherId.toLowerCase()!==voucherId(config.vaultAddress,voucher).toLowerCase() || !equal(state.owner,voucher.owner) || !equal(state.merchant,voucher.merchant) || state.amountRaw!==voucher.amount.toString() || state.validBefore!==voucher.validBefore.toString()) throw new GhostChainError("PROOF_MISMATCH","Voucher fields do not match its funded reservation.");
}
type ProofLog={address:string;data:Hash;topics:readonly Hash[];logIndex:number|null};
export function matchGhostProofLogs(logs:readonly ProofLog[],config:ReadyGhostConfig,id:Hash,action:GhostAction,expected:{owner:Address;merchant:Address;amountRaw:string}) {
  const eventName=action==="reserve"?"VoucherReserved":action==="redeem"?"VoucherRedeemed":"VoucherReclaimed";
  let matched:{logIndex:number;validBefore?:bigint;salt?:Hash}|null=null, transfer=false;
  for(const log of logs) {
    if(equal(log.address,config.vaultAddress)) {
      try {
        const event=decodeEventLog({abi:ghostAbi,eventName,data:log.data,topics:log.topics as [Hash,...Hash[]]});
        const a=event.args as {voucherId:Hash;owner:Address;merchant?:Address;amount:bigint;validBefore?:bigint;salt?:Hash};
        if(equal(a.voucherId,id) && equal(a.owner,expected.owner) && a.amount.toString()===expected.amountRaw && (action==="reclaim" || (a.merchant && equal(a.merchant,expected.merchant))) && log.logIndex!==null) matched={logIndex:log.logIndex,validBefore:a.validBefore,salt:a.salt};
      } catch { /* Unrelated logs cannot establish proof. */ }
    }
    if(equal(log.address,config.tokenAddress)) {
      try {
        const a=decodeEventLog({abi:erc20Abi,eventName:"Transfer",data:log.data,topics:log.topics as [Hash,...Hash[]]}).args;
        const from=action==="reserve"?expected.owner:config.vaultAddress;
        const to=action==="reserve"?config.vaultAddress:action==="redeem"?expected.merchant:expected.owner;
        if(equal(a.from,from) && equal(a.to,to) && a.value.toString()===expected.amountRaw) transfer=true;
      } catch { /* Unrelated token events cannot establish proof. */ }
    }
  }
  return matched && transfer?matched:null;
}
export async function verifyGhostProof(client:PublicClient,config:GhostConfig,id:Hash,txHash:Hash,action:GhostAction,expectedVoucher?:GhostVoucher):Promise<GhostProof> {
  requireDeployedConfig(config);
  if(!hashPattern.test(id) || !hashPattern.test(txHash)) throw new GhostChainError("MALFORMED_INPUT","Invalid proof reference.");
  const state=await readGhostState(client,config,id);
  if(state.storageStatus===0) throw new GhostChainError("UNKNOWN_VOUCHER","Voucher has not been funded.");
  if(expectedVoucher) assertReservationMatches(state,expectedVoucher,config);
  const receipt=await client.getTransactionReceipt({hash:txHash});
  if(receipt.status!=="success" || !receipt.to || !equal(receipt.to,config.vaultAddress) || !equal(receipt.from,action==="redeem"?state.merchant:state.owner)) throw new GhostChainError("PROOF_MISMATCH","Transaction does not prove the expected voucher action.");
  const [block,head]=await Promise.all([client.getBlock({blockNumber:receipt.blockNumber}),freshHead(client)]);
  if(!block.hash || block.hash!==receipt.blockHash || head.number<receipt.blockNumber) throw new GhostChainError("PROOF_MISMATCH","Transaction is not in the canonical chain.");
  const confirmations=Number(head.number-receipt.blockNumber+1n);
  if(confirmations<config.confirmationsRequired) throw new GhostChainError("CONFIRMATIONS_PENDING",`Waiting for ${config.confirmationsRequired} confirmations (${confirmations} observed).`);
  const matched=matchGhostProofLogs(receipt.logs,config,id,action,state);
  if(!matched) throw new GhostChainError("PROOF_MISMATCH","The voucher event and exact token transfer do not match.");
  const proof:GhostProof={voucherId:id,action,txHash,logIndex:matched.logIndex,blockNumber:receipt.blockNumber.toString(),blockHash:block.hash,blockTimestamp:block.timestamp.toString(),confirmations,owner:state.owner,merchant:state.merchant,amountRaw:state.amountRaw,verified:true,scope:action==="reserve"?"reservationProof":action==="redeem"?"redemptionProof":"reclaimProof"};
  if(action==="reserve") {
    if(matched.validBefore===undefined || !matched.salt) throw new GhostChainError("PROOF_MISMATCH","Reservation fields missing.");
    const v={owner:state.owner,merchant:state.merchant,amount:BigInt(state.amountRaw),validBefore:matched.validBefore,salt:matched.salt};
    assertReservationMatches(state,v,config);
    proof.voucher={owner:v.owner,merchant:v.merchant,amountRaw:v.amount.toString(),validBefore:v.validBefore.toString(),salt:v.salt};
  }
  return proof;
}
