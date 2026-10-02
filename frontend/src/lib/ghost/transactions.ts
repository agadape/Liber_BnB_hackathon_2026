import {BaseError,ContractFunctionRevertedError,encodeFunctionData,erc20Abi,getAddress,type Address,type Hash,type Hex} from "viem";
import {GHOST} from "./protocol";
import {ghostAbi} from "./ghost-abi";
import {ghostRpc} from "./config";
import {requireReadyConfig,assertGhostDeployment,freshHead,readGhostState,verifyGhostProof,assertReservationMatches,GhostChainError,type GhostConfig,type GhostAction,type GhostState} from "./chain";
import {voucherId,validateSignature,type GhostVoucher} from "./codec";
import {getActiveWallet,sendActiveWallet,type ActiveWallet} from "../wallet/activeWallet";
export const ghostTxUrl=(hash:string)=>`https://testnet.bscscan.com/tx/${hash}`;
export function expiryLabel(seconds:string|bigint):string {const n=Number(seconds);if(!Number.isSafeInteger(n)||n>8_640_000_000_000)return "Unsupported display date";return new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(new Date(n*1000))+" WIB";}
export function safeGhostError(error:unknown):string {
  if(error instanceof GhostChainError)return error.message;
  if(error instanceof BaseError){const reverted=error.walk(e=>e instanceof ContractFunctionRevertedError);if(reverted instanceof ContractFunctionRevertedError){const name=reverted.data?.errorName;const messages:Record<string,string>={NotMerchant:"Connect the merchant wallet named on this voucher.",NotOwner:"Connect the original voucher owner.",VoucherExpired:"This voucher has expired. The owner can reclaim its funds.",VoucherNotExpired:"Funds remain locked until the exact expiry.",VoucherNotReserved:"This voucher has already been redeemed or reclaimed.",UnknownVoucher:"This voucher is not funded.",InvalidExpiry:"Reservation arrived too late. Review a new expiry and sign again.",SaltAlreadyUsed:"This voucher salt was already used. Create a new voucher.",InvalidVoucherSignature:"Voucher authorization is invalid.",InvalidAmount:"Use a positive amount up to 1,000 MockUSDC."};return messages[name??""]??"The contract rejected this action. Check the voucher state before retrying.";}}
  if(error instanceof Error && error.name==="GhostUiError")return error.message;
  return "The action could not be completed. Check your wallet, network and saved transaction before retrying.";
}
export function uiError(message:string):Error {const e=new Error(message);e.name="GhostUiError";return e;}
export async function assertActiveOwner(wallet:ActiveWallet,expected:Address,config:GhostConfig):Promise<void> {
  requireReadyConfig(config);const active=await getActiveWallet();
  if(active.mode!==wallet.mode || getAddress(active.publicKey)!==getAddress(expected) || getAddress(wallet.publicKey)!==getAddress(expected))throw uiError("Wallet account changed. Reconnect and review before signing.");
  if(await ghostRpc().getCode({address:expected}))throw uiError("Ghost V1 supports ordinary EOA wallets. Smart and delegated accounts are not supported.");
}
export async function newGhostVoucher(config:GhostConfig,owner:Address,merchant:Address,amount:bigint,minutes:number):Promise<GhostVoucher> {
  requireReadyConfig(config);await assertGhostDeployment(ghostRpc(),config);
  if(![5,15,60,1440].includes(minutes))throw uiError("Choose a supported voucher duration.");
  if(getAddress(merchant)===config.tokenAddress)throw uiError("Use a merchant wallet, not the token contract.");
  const head=await freshHead(ghostRpc());const salt=crypto.getRandomValues(new Uint8Array(32));
  return {owner:getAddress(owner),merchant:getAddress(merchant),amount,validBefore:head.timestamp+BigInt(minutes*60+(minutes===5?60:0)),salt:("0x"+Array.from(salt,b=>b.toString(16).padStart(2,"0")).join("")) as Hash};
}
export async function ownerBalances(config:GhostConfig,owner:Address) {
  requireReadyConfig(config);await assertGhostDeployment(ghostRpc(),config);
  const [token,gas,allowance]=await Promise.all([ghostRpc().readContract({address:config.tokenAddress,abi:erc20Abi,functionName:"balanceOf",args:[owner]}),ghostRpc().getBalance({address:owner}),ghostRpc().readContract({address:config.tokenAddress,abi:erc20Abi,functionName:"allowance",args:[owner,config.vaultAddress]})]);
  return {token,gas,allowance};
}
export async function approveGhost(wallet:ActiveWallet,config:GhostConfig,v:GhostVoucher):Promise<Hash> {
  requireReadyConfig(config);await assertActiveOwner(wallet,v.owner,config);
  await ghostRpc().simulateContract({address:config.tokenAddress,abi:erc20Abi,functionName:"approve",args:[config.vaultAddress,v.amount],account:v.owner});
  return sendActiveWallet(wallet,{to:config.tokenAddress,data:encodeFunctionData({abi:erc20Abi,functionName:"approve",args:[config.vaultAddress,v.amount]})}) as Promise<Hash>;
}
export async function reserveGhost(wallet:ActiveWallet,config:GhostConfig,v:GhostVoucher,signature:Hex):Promise<Hash> {
  requireReadyConfig(config);await assertActiveOwner(wallet,v.owner,config);await validateSignature(config.vaultAddress,v,signature);await freshHead(ghostRpc());
  await ghostRpc().simulateContract({address:config.vaultAddress,abi:ghostAbi,functionName:"reserve",args:[v],account:v.owner});
  return sendActiveWallet(wallet,{to:config.vaultAddress,data:encodeFunctionData({abi:ghostAbi,functionName:"reserve",args:[v]})}) as Promise<Hash>;
}
export async function readyForPrint(config:GhostConfig,v:GhostVoucher,hash:Hash):Promise<GhostState> {
  requireReadyConfig(config);await verifyGhostProof(ghostRpc(),config,voucherId(config.vaultAddress,v),hash,"reserve",v);
  const state=await readGhostState(ghostRpc(),config,voucherId(config.vaultAddress,v));assertReservationMatches(state,v,config);
  if(state.effectiveStatus!=="reserved" || BigInt(state.validBefore)-BigInt(state.checkedBlockTimestamp)<=BigInt(GHOST.redeemBufferSeconds))throw uiError("Voucher is no longer ready for handover. Check its state or reclaim after expiry.");
  return state;
}
export async function redeemGhost(wallet:ActiveWallet,config:GhostConfig,v:GhostVoucher,signature:Hex):Promise<Hash> {
  requireReadyConfig(config);await assertActiveOwner(wallet,v.merchant,config);await validateSignature(config.vaultAddress,v,signature);
  const state=await readGhostState(ghostRpc(),config,voucherId(config.vaultAddress,v));assertReservationMatches(state,v,config);
  if(state.effectiveStatus!=="reserved")throw uiError(state.effectiveStatus==="redeemed"?"Already redeemed. Do not submit another transaction.":"This voucher is not available for redemption.");
  if(BigInt(state.validBefore)-BigInt(state.checkedBlockTimestamp)<=60n)throw uiError("Expiry is too close to start a new claim. The owner can reclaim after expiry.");
  await ghostRpc().simulateContract({address:config.vaultAddress,abi:ghostAbi,functionName:"redeem",args:[v,signature],account:v.merchant});
  return sendActiveWallet(wallet,{to:config.vaultAddress,data:encodeFunctionData({abi:ghostAbi,functionName:"redeem",args:[v,signature]})}) as Promise<Hash>;
}
export async function reclaimGhost(wallet:ActiveWallet,config:GhostConfig,id:Hash):Promise<Hash> {
  requireReadyConfig(config);const state=await readGhostState(ghostRpc(),config,id);await assertActiveOwner(wallet,state.owner,config);
  if(state.effectiveStatus!=="expired_reclaimable")throw uiError("Reclaim is available only after expiry for an unredeemed voucher.");
  await ghostRpc().simulateContract({address:config.vaultAddress,abi:ghostAbi,functionName:"reclaim",args:[id],account:state.owner});
  return sendActiveWallet(wallet,{to:config.vaultAddress,data:encodeFunctionData({abi:ghostAbi,functionName:"reclaim",args:[id]})}) as Promise<Hash>;
}
export async function confirmGhost(config:GhostConfig,id:Hash,hash:Hash,action:GhostAction,onReplacement?:(hash:Hash)=>void) {
  requireReadyConfig(config);let minedHash=hash,changed=false;
  const receipt=await ghostRpc().waitForTransactionReceipt({hash,confirmations:config.confirmationsRequired,timeout:120_000,onReplaced:replacement=>{
    if(replacement.reason!=="repriced"){changed=true;return;}
    minedHash=replacement.transaction.hash;onReplacement?.(minedHash);
  }});
  if(changed)throw uiError("The transaction was replaced or cancelled. Check its result before starting another action.");
  if(receipt.status!=="success")throw uiError("Transaction reverted. No voucher action was completed.");
  return verifyGhostProof(ghostRpc(),config,id,minedHash,action);
}
