import {getPool} from "../db/pool.js";
import {checksExplanation,modelFacts,type Facts,type Explanation} from "../routes/copilot.js";

export async function generateExplanation(facts:Facts,oidcToken?:string,fetchImpl:typeof fetch=fetch):Promise<Explanation> {
  if(!oidcToken || process.env.COPILOT_ENABLED!=="true")return checksExplanation;
  try {
    const res=await fetchImpl("https://ai-gateway.vercel.sh/v1/chat/completions",{method:"POST",signal:AbortSignal.timeout(15_000),
      headers:{"Content-Type":"application/json",Authorization:`Bearer ${oidcToken}`},
      body:JSON.stringify({model:"google/gemini-2.5-flash-lite",max_tokens:300,temperature:0.2,response_format:{type:"json_object"},
        messages:[{role:"system",content:'Explain the supplied validated facts in simple Indonesian. Return JSON with summary and nextStep, each at most 220 characters. Do not provide links, addresses, payment instructions, investment advice or instructions to transfer funds. Never claim QR authenticity, merchant trust, real payment, Kolo support or real monetary value of MockUSDC. A QRIS scan is reference only. Invoice Liber is a separate testnet token flow. You have no tools or authority to sign transactions.'},{role:"user",content:JSON.stringify(modelFacts(facts))}]})});
    if(!res.ok)return checksExplanation;
    const data=await res.json(),answer=JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    if(![answer.summary,answer.nextStep].every(s=>typeof s==="string" && s.length>0 && s.length<=220 && !/https?:|0x[a-f0-9]{40}|private.?key|seed phrase/i.test(s)))return checksExplanation;
    return {mode:"ai",model:"google/gemini-2.5-flash-lite",summary:answer.summary,nextStep:answer.nextStep};
  }catch{return checksExplanation;}
}
export async function budgetedExplanation(facts:Facts,oidcToken?:string) {
  if(!oidcToken || process.env.COPILOT_ENABLED!=="true")return checksExplanation;
  const budget=await getPool().query(`INSERT INTO copilot_usage(bucket,requests) VALUES(to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD'),1)
    ON CONFLICT(bucket) DO UPDATE SET requests=copilot_usage.requests+1 WHERE copilot_usage.requests<100 RETURNING requests`);
  return budget.rowCount ? generateExplanation(facts,oidcToken) : checksExplanation;
}
