import {readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {createPublicClient,createWalletClient,http,getAddress,parseEther,type Hex} from "viem";
import {privateKeyToAccount} from "viem/accounts";
import {bscTestnet} from "viem/chains";
const record=resolve("../../outputs/ghost/ghost-ui-gas.json");
if(process.argv[2]!=="--fund")throw Error("Explicit --fund, dedicated key file, buyer and merchant required. TEST BNB only.");
const account=privateKeyToAccount(JSON.parse(await readFile(process.argv[3],"utf8")).privateKey as Hex);
if(account.address!=="0x80a92Cac1a63799170af13d17313b45EB77661e5")throw Error("Dedicated test deployer required.");
const recipients=process.argv.slice(4).map(value=>getAddress(value));if(recipients.length!==2||recipients[0]===recipients[1])throw Error("Two distinct public UI test-wallet addresses required.");
const rpc=createPublicClient({chain:bscTestnet,transport:http()});if(await rpc.getChainId()!==97)throw Error("Only BSC Testnet.");
const wallet=createWalletClient({account,chain:bscTestnet,transport:http()});let report={chainId:97,scope:"UI TEST BNB gas only; two transfers of 0.001",transfers:[] as {to:string;hash:Hex}[]};
try{report=JSON.parse(await readFile(record,"utf8"));}catch(error){if((error as {code?:string}).code!=="ENOENT")throw error;}
if(report.chainId!==97||report.transfers.length>2||report.transfers.some(t=>!recipients.includes(getAddress(t.to))))throw Error("Funding report does not match this UI test.");
for(const to of recipients){
  const previous=report.transfers.find(t=>getAddress(t.to)===to);let hash=previous?.hash;
  if(!hash){hash=await wallet.sendTransaction({to,value:parseEther("0.001")});report.transfers.push({to,hash});await writeFile(record,JSON.stringify(report,null,2)+"\n");}
  const receipt=await rpc.waitForTransactionReceipt({hash,confirmations:12});if(receipt.status!=="success")throw Error("Funding reverted; inspect saved hash.");
  const transaction=await rpc.getTransaction({hash});
  if(transaction.chainId!==97||getAddress(transaction.from)!==account.address||!transaction.to||getAddress(transaction.to)!==to||transaction.value!==parseEther("0.001")||transaction.input!=="0x")throw Error("Saved funding transaction does not match the allowed transfer.");
}
console.log(JSON.stringify(report,null,2));
