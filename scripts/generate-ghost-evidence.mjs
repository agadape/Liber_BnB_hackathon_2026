import {readFile,writeFile} from "node:fs/promises";
const root=new URL("../",import.meta.url);
const report=JSON.parse(await readFile(new URL("contracts/deployments/ghost-demo-e2e.json",root),"utf8"));
if(!report.proofs.redeem?.verified || !report.proofs.reclaim?.verified || !report.checks.replayRejected || !report.checks.earlyReclaimRejected)throw Error("Ghost evidence is incomplete.");
const publicData={vault:report.vault,paymentId:report.proofs.redeem.voucherId,redeemTx:report.proofs.redeem.txHash,reclaimTx:report.proofs.reclaim.txHash,amountRaw:report.proofs.redeem.amountRaw,confirmedAt:"2026-10-02",physicalPhoneOffTest:report.physicalPhoneOffTest};
await writeFile(new URL("frontend/src/lib/ghost/evidence.ts",root),"// Recorded public testnet run, not a cached claim of current finality.\nexport const GHOST_DEMO = "+JSON.stringify(publicData,null,2)+" as const;\n");
