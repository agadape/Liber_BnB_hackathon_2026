import {encodeFunctionData, type Address} from "viem";

// Deployed MockUSDC, not a generic token supplied by a checkout URL.
export const DEMO_TOKEN: Address = "0x2116D4a3f11Aa7059Ad0911ad5C89897CC0BcC97";
const faucetAbi = [{name:"faucet",type:"function",stateMutability:"nonpayable",inputs:[],outputs:[]}] as const;

export function demoFaucetTx(config:{chainId:number;testnet:boolean;tokenAddress:Address|null;tokenDecimals:number},walletChain:number) {
  if(walletChain!==97||config.chainId!==97||!config.testnet||config.tokenDecimals!==18||config.tokenAddress?.toLowerCase()!==DEMO_TOKEN.toLowerCase()) {
    throw new Error("Demo token claims require the Liber MockUSDC contract on BSC Testnet (97).");
  }
  return {to:DEMO_TOKEN,data:encodeFunctionData({abi:faucetAbi,functionName:"faucet"})};
}
