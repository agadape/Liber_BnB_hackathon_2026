import type {RecoveryCursor} from "./limits.js";

// A block-range bound alone does not bound verification work in a dense block.
export const RECOVERY_PROOFS_PER_PAGE = 5;
type PositionedLog = {blockNumber:bigint|null;logIndex:number|null};
export function recoveryPage<T extends PositionedLog>(logs:readonly T[],cursor:RecoveryCursor,to:bigint){
  const from=BigInt(cursor.next),upper=BigInt(cursor.upper);
  if(to<from||to>upper||to-from>=1000n)throw Error("Invalid recovery range");
  const ordered=logs.map(log=>{
    if(log.blockNumber===null||log.logIndex===null||log.blockNumber<from||log.blockNumber>to||!Number.isSafeInteger(log.logIndex)||log.logIndex<0)throw Error("Invalid recovery event position");
    return log;
  }).filter(log=>log.blockNumber!==from || cursor.afterLog===undefined || log.logIndex! > cursor.afterLog)
    .sort((a,b)=>a.blockNumber === b.blockNumber ? a.logIndex! - b.logIndex! : a.blockNumber! < b.blockNumber! ? -1 : 1);
  for(let i=1;i<ordered.length;i++)if(ordered[i].blockNumber===ordered[i-1].blockNumber&&ordered[i].logIndex===ordered[i-1].logIndex)throw Error("Duplicate recovery event position");
  const items=ordered.slice(0,RECOVERY_PROOFS_PER_PAGE);
  const {afterLog:_previous,...base}=cursor;
  const last=items.at(-1);
  const next:RecoveryCursor|null=ordered.length>items.length&&last
    ? {...base,next:last.blockNumber!.toString(),afterLog:last.logIndex!}
    : to<upper?{...base,next:(to+1n).toString()}:null;
  return {items,next};
}
