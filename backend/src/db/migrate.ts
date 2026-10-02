import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { getPool } from "./pool.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function migrate() {
  const sql = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  await getPool().query(sql);
  const ghostSql = readFileSync(join(__dirname, "ghost-migration.sql"), "utf-8");
  await getPool().query(ghostSql);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await migrate();
  console.log("migration complete");
  process.exit(0);
}
