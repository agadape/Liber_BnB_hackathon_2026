import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=fileURLToPath(new URL("../",import.meta.url));
const artifact=JSON.parse(await readFile(path.join(root,"contracts/out/LiberGhostVault.sol/LiberGhostVault.json"),"utf8"));
const source=`// Generated from the compiled LiberGhostVault artifact.\nexport const ghostAbi = ${JSON.stringify(artifact.abi,null,2)} as const;\n`;
for(const app of ["frontend","backend"]) {
 const target=path.join(root,app,"src",app==="frontend"?"lib/ghost":"ghost","ghost-abi.ts");
 await mkdir(path.dirname(target),{recursive:true}); await writeFile(target,source);
}
await writeFile(path.join(root,"contracts/artifacts/LiberGhostVault.json"),JSON.stringify({contractName:"LiberGhostVault",compiler:"0.8.24",abi:artifact.abi},null,2)+"\n");
console.log("Ghost ABI generated from compiled contract.");
