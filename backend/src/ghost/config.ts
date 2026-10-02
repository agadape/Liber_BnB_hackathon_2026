import { getAddress, isAddress, type Address } from "viem";
import type { GhostConfig } from "./chain.js";
const address=(value:string|undefined):Address|null=>value && isAddress(value) && !/^0x0{40}$/i.test(value)?getAddress(value):null;
export function ghostConfig(env:NodeJS.ProcessEnv=process.env):GhostConfig {
  const vaultAddress=address(env.GHOST_VAULT_ADDRESS),tokenAddress=address(env.GHOST_TOKEN_ADDRESS);
  const block=env.GHOST_VAULT_DEPLOYMENT_BLOCK;
  const confirmations=Number(env.GHOST_CONFIRMATIONS??12);
  let reason:string|null=null;
  if(env.GHOST_ENABLED!=="true") reason="Ghost issuance is not enabled yet.";
  else if(Number(env.GHOST_CHAIN_ID??97)!==97) reason="Ghost only supports BSC Testnet.";
  else if(!vaultAddress || !tokenAddress || !block || !/^\d+$/.test(block)) reason="Ghost contract deployment is not configured.";
  else if(Number(env.GHOST_TOKEN_DECIMALS??18)!==18 || !Number.isInteger(confirmations) || confirmations<12) reason="Ghost protocol configuration is invalid.";
  else if(!/^[a-fA-F0-9]{64,}$/.test(env.GHOST_SERVER_HMAC_SECRET??"")) reason="Ghost metadata protection is not configured.";
  return {enabled:!reason,chainId:97,vaultAddress,tokenAddress,tokenDecimals:18,deploymentBlock:block && /^\d+$/.test(block)?block:null,confirmationsRequired:Number.isInteger(confirmations)&&confirmations>=12?confirmations:12,tokenLabel:"MockUSDC",testnet:true,reason};
}
