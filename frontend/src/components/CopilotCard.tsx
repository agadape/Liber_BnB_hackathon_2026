"use client";
import {useState} from "react";
import {Card} from "./ui/Card";
import {Button} from "./ui/Button";
import {authenticatedFetch} from "@/lib/auth";
export interface Inspection {facts:{merchantName:string;merchantCity:string;amountIdr:string|null;method:string;checksumValid:boolean};quote:{amountUsdc:string;expiresAt:string}|null;copilot?:{mode:"ai"|"checks";summary:string;nextStep:string;model?:string};checks:string[];limitations:string[];payload?:string}
export function CopilotCard({inspection,payload,onUpdate}:{inspection:Inspection;payload?:string;onUpdate?:(value:Inspection)=>void}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
  const copilot=inspection.copilot;
  return <Card className="flex flex-col gap-3 border border-emerald/15">
    <div className="flex items-center justify-between"><h2 className="font-semibold">Payment Copilot</h2><span className="rounded-full bg-emerald/10 px-3 py-1 text-xs text-emerald">{copilot?.mode==="ai"?"AI explanation":"Verified checks"}</span></div>
    <div className="flex flex-wrap gap-2">{inspection.checks.map(check=><span key={check} className="rounded-full bg-emerald/5 px-2 py-1 text-xs text-emerald">✓ {check}</span>)}</div>
    {copilot && <><p className="text-sm text-ink/80">{copilot.summary}</p><p className="text-sm text-ink/60">{copilot.nextStep}</p></>}
    <p className="text-xs text-ink/60">Checksum checks data integrity. Merchant identity and QRIS payment are not verified. MockUSDC has no monetary value.</p>
    {copilot?.mode!=="ai" && payload && onUpdate && <Button variant="ghost" disabled={busy} onClick={async()=>{
      setBusy(true);setError(null);
      try {const res=await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/copilot/explain`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({payload,amountIdr:inspection.facts.amountIdr ?? undefined})});const body=await res.json();if(!res.ok)throw Error(body.error);onUpdate(body);if(body.copilot?.mode!=="ai")setError("AI is unavailable. The validated checks above remain available.");}
      catch(e){setError((e as Error).message);}finally{setBusy(false);}
    }}>{busy?"Explaining…":"Explain in Indonesian"}</Button>}
    {payload && <p className="text-[11px] text-ink/65">AI receives the amount and check results only. It cannot sign or send transactions.</p>}
    {error && <p role="status" className="text-xs text-ink/60">{error}</p>}
  </Card>;
}
