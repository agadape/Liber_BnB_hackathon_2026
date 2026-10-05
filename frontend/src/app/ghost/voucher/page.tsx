import {GhostVoucherForm} from "@/components/ghost/GhostVoucherForm";
import {hashPattern} from "@/lib/ghost/codec";
import type {Hash} from "viem";
import Link from "next/link";
import {GhostShell} from "@/components/ghost/GhostShell";
export default async function GhostVoucherPage({searchParams}:{searchParams:Promise<{id?:string}>}) {
  const {id}=await searchParams;
  if(!id||!hashPattern.test(id))return <GhostShell title="That voucher link is incomplete." eyebrow="OWNER / RECOVERY"><p role="alert" className="ghost-error">Open the full link for your saved reservation, or recover it using the original owner wallet.</p><Link href="/ghost/vouchers" className="landing-text-link">Recover your paper trail ↗</Link></GhostShell>;
  return <GhostVoucherForm key={id} initialId={id as Hash}/>;
}
