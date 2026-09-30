import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { inspectQris } from "../qris/validate.js";
import { buildQris } from "../qris/test-helpers.js";
import { getQuote } from "../quote/quote.js";
import { requireWallet } from "../auth/auth.js";

export const DEMO_QR = buildQris([["00","01"],["01","12"],["53","360"],["54","25000"],["58","ID"],["59","Liber Demo Coffee"],["60","Yogyakarta"]]);
export type Facts = ReturnType<typeof inspectQris>;
export type Explanation = {mode:"checks"|"ai";summary:string;nextStep:string;model?:string};
export function modelFacts(facts: Facts) {
  // Merchant text, raw QR payloads, wallet addresses and private keys are excluded.
  return { amountIdr: facts.amountIdr, method: facts.method, checksumValid: true,
    merchantIdentityVerified: false, qrisSettlementSupported: false, network: "BSC Testnet", token: "MockUSDC", tokenHasMonetaryValue: false };
}
export const checksExplanation: Explanation = {mode:"checks",summary:"Format dan checksum QR cocok. Ini belum membuktikan identitas merchant atau pembayaran.",nextStep:"Periksa nominal. Untuk mencoba pembayaran token, gunakan invoice Liber di BSC Testnet."};
async function inspect(body: {payload?:unknown;amountIdr?:unknown}) {
  const facts=inspectQris(body.payload as string,body.amountIdr as string|undefined);
  const quote=facts.amountIdr ? await getQuote(Number(facts.amountIdr)).catch(()=>null) : null;
  return { facts, quote, checks:["Format valid","Checksum matches","Currency IDR"], limitations:["Merchant identity not verified","QRIS settlement not supported","MockUSDC has no monetary value"] };
}
export function createCopilotRoute(explain: (facts:Facts,oidcToken?:string)=>Promise<Explanation> = async()=>checksExplanation) {
  const route=new Hono();
  route.use("/copilot/*",bodyLimit({maxSize:8192}));
  route.post("/copilot/inspect",async c=>{
    try { return c.json(await inspect(await c.req.json())); } catch(e) { return c.json({error:e instanceof Error ? e.message : "Invalid QR"},400); }
  });
  route.post("/copilot/explain",requireWallet,async c=>{
    try { const result=await inspect(await c.req.json()); return c.json({...result,copilot:await explain(result.facts,c.req.header("x-vercel-oidc-token"))}); }
    catch(e) { return c.json({error:e instanceof Error ? e.message : "Invalid QR"},400); }
  });
  route.post("/copilot/demo",async c=>{
    const body=await c.req.json().catch(()=>({}));
    if (!["valid","corrupt"].includes(body.sample)) return c.json({error:"Choose a built-in demo sample"},400);
    const payload=body.sample==="valid" ? DEMO_QR : DEMO_QR.slice(0,-1)+(DEMO_QR.endsWith("0")?"1":"0");
    try { const result=await inspect({payload}); return c.json({...result,payload,copilot:await explain(result.facts,c.req.header("x-vercel-oidc-token"))}); }
    catch(e) { return c.json({error:e instanceof Error ? e.message : "Invalid QR",payload},400); }
  });
  return route;
}
