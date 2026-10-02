import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const protocol = JSON.parse(await readFile(path.join(root, "protocol/ghost-v1.json"), "utf8"));
const check = process.argv.includes("--check");
const contents = `// Generated from protocol/ghost-v1.json; run scripts/generate-ghost-protocol.mjs.\nexport const GHOST = ${JSON.stringify(protocol, null, 2)} as const;\nexport const ghostTypes = { GhostVoucher: GHOST.fields } as const;\n`;
for (const app of ["frontend", "backend"]) {
  const target = path.join(root, app, "src", app === "frontend" ? "lib/ghost" : "ghost", "protocol.ts");
  if (check) {
    if (await readFile(target, "utf8") !== contents) throw new Error(`Protocol drift: ${target}`);
  } else {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents);
  }
  for (const name of ["codec", "chain"]) {
    const template = await readFile(path.join(root,"protocol/templates",`${name}.ts`),"utf8");
    const source = app === "backend" ? template.replace(/from "\.\/(protocol|ghost-abi|codec)"/g,'from "./$1.js"') : template;
    const destination = path.join(path.dirname(target),`${name}.ts`);
    if (check) { if(await readFile(destination,"utf8")!==source) throw new Error(`Protocol source drift: ${destination}`); }
    else await writeFile(destination,source);
  }
}
console.log(check ? "Ghost protocol definitions match." : "Ghost protocol definitions generated.");
