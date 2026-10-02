import {GhostProofView} from "@/components/ghost/GhostProofView";
import {hashPattern} from "@/lib/ghost/codec";
import type {Hash} from "viem";
export default async function GhostReceiptPage({searchParams}:{searchParams:Promise<{id?:string}>}){const {id}=await searchParams;return <GhostProofView id={id&&hashPattern.test(id)?id as Hash:null}/>;}
