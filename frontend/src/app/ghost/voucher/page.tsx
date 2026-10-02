import {GhostVoucherForm} from "@/components/ghost/GhostVoucherForm";
import {hashPattern} from "@/lib/ghost/codec";
import type {Hash} from "viem";
export default async function GhostVoucherPage({searchParams}:{searchParams:Promise<{id?:string}>}){const {id}=await searchParams;return <GhostVoucherForm initialId={id&&hashPattern.test(id)?id as Hash:undefined}/>;}
