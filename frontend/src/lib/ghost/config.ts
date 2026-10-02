import { getAddress, isAddress, createPublicClient, http, type Address } from "viem";
import {bscTestnet} from "viem/chains";
import type {GhostConfig} from "./chain";
const address=(v:string|undefined):Address|null=>v && isAddress(v) && !/^0x0{40}$/i.test(v)?getAddress(v):null;
export const ghostRpc=()=>createPublicClient({chain:bscTestnet,transport:http(process.env.NEXT_PUBLIC_BSC_RPC_URL||bscTestnet.rpcUrls.default.http[0],{timeout:12_000,retryCount:1})});
export function localGhostConfig():GhostConfig {
  const vaultAddress=address(process.env.NEXT_PUBLIC_GHOST_VAULT_ADDRESS),tokenAddress=address(process.env.NEXT_PUBLIC_GHOST_TOKEN_ADDRESS);
  const block=process.env.NEXT_PUBLIC_GHOST_DEPLOYMENT_BLOCK;
  const confirmations=Number(process.env.NEXT_PUBLIC_GHOST_CONFIRMATIONS??12);
  let reason:string|null=null;
  if(process.env.NEXT_PUBLIC_GHOST_ENABLED!=="true")reason="Ghost issuance is not enabled yet.";
  else if(Number(process.env.NEXT_PUBLIC_GHOST_CHAIN_ID??97)!==97 || Number(process.env.NEXT_PUBLIC_CHAIN_ID??97)!==97)reason="Ghost only supports BSC Testnet.";
  else if(!vaultAddress || !tokenAddress || !block || !/^\d+$/.test(block))reason="Ghost contract deployment is not configured.";
  else if(!Number.isInteger(confirmations) || confirmations<12)reason="Ghost confirmation policy is invalid.";
  return {enabled:!reason,chainId:97,vaultAddress,tokenAddress,tokenDecimals:18,deploymentBlock:block&&/^\d+$/.test(block)?block:null,confirmationsRequired:Number.isInteger(confirmations)&&confirmations>=12?confirmations:12,tokenLabel:"MockUSDC",testnet:true,reason};
}
export async function getGhostConfig():Promise<GhostConfig> {
  const local=localGhostConfig();if(!local.enabled)return local;
  const base=process.env.NEXT_PUBLIC_BACKEND_URL;
  if(!base)return local;
  let remote:GhostConfig;
  try { const r=await fetch(`${base}/ghost/config`,{cache:"no-store",signal:AbortSignal.timeout(5000)});if(!r.ok)return local;remote=await r.json(); }catch{return local;}
  if(!remote.enabled || remote.vaultAddress?.toLowerCase()!==local.vaultAddress?.toLowerCase() || remote.tokenAddress?.toLowerCase()!==local.tokenAddress?.toLowerCase() || remote.chainId!==97 || remote.confirmationsRequired!==local.confirmationsRequired)return {...local,enabled:false,reason:"Frontend and API Ghost configuration do not match."};
  return local;
}
