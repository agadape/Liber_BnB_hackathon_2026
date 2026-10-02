import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
async function discover(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(e => e.isDirectory() ? discover(path.join(dir,e.name)) : e.name.endsWith(".test.ts") ? [path.join(dir,e.name)] : []));
  return files.flat().sort();
}
const files = await discover("src");
const child = spawn(process.execPath, ["--env-file-if-exists=.env", "--import", "tsx", "--test", ...files], { stdio: "inherit", shell: false });
child.on("error", e => { console.error(e.message); process.exitCode = 1; });
child.on("exit", code => { process.exitCode = code ?? 1; });
