import { writeFile, mkdir } from "node:fs/promises";
import { privateKeyToAccount } from "viem/accounts";
import { hashTypedData, encodeAbiParameters } from "viem";
// Deliberately public TEST KEY. Never fund this key or use it for deployment.
const testKey="0x"+"0".repeat(63)+"1";
const account=privateKeyToAccount(testKey);
const vault="0x1111111111111111111111111111111111111111";
const voucher={owner:account.address,merchant:"0x2222222222222222222222222222222222222222",amount:5000000000000000000n,validBefore:1800003600n,salt:"0x"+"ab".repeat(32)};
const fields=[{name:"owner",type:"address"},{name:"merchant",type:"address"},{name:"amount",type:"uint256"},{name:"validBefore",type:"uint64"},{name:"salt",type:"bytes32"}];
const typed={domain:{name:"LiberGhost",version:"1",chainId:97,verifyingContract:vault},types:{GhostVoucher:fields},primaryType:"GhostVoucher",message:voucher};
const signature=await account.signTypedData(typed);
const bytes=encodeAbiParameters([{type:"uint8"},{type:"uint256"},{type:"address"},{type:"tuple",components:fields},{type:"bytes"}],[1,97n,vault,voucher,signature]);
const packet="liber-ghost:v1:"+Buffer.from(bytes.slice(2),"hex").toString("base64url");
const result={notice:"Public test-only key. NEVER fund or deploy with it.",testKey,vault,voucher:{...voucher,amountRaw:voucher.amount.toString(),validBefore:voucher.validBefore.toString()},signature,voucherId:hashTypedData(typed),packet,packetBytes:(bytes.length-2)/2,packetCharacters:packet.length};
delete result.voucher.amount;
const directory=new URL("../../protocol/fixtures/",import.meta.url); await mkdir(directory,{recursive:true}); await writeFile(new URL("ghost-v1-golden.json",directory),JSON.stringify(result,null,2)+"\n");
console.log(`Golden Ghost fixture: ${result.packetBytes} bytes, ${result.packetCharacters} QR characters.`);
