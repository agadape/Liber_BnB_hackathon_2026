import Link from "next/link";
import {DEMO_LINKS} from "@/lib/demo-links";
export function ExampleProofs(){
  return <div className="rounded-2xl border border-emerald/15 bg-white p-4"><p className="text-[11px] font-semibold uppercase tracking-widest text-ink/55">Completed test runs · open without a wallet</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><Link href={DEMO_LINKS.sandboxReceipt} className="rounded-xl bg-emerald/5 px-4 py-3 text-sm font-semibold text-emerald hover:bg-emerald/10">Rp10.000 QRIS sandbox <span aria-hidden="true">↗</span></Link><Link href={DEMO_LINKS.tokenReceipt} className="rounded-xl bg-gold/10 px-4 py-3 text-sm font-semibold text-ink hover:bg-gold/20">5 MockUSDC on BNB <span aria-hidden="true">↗</span></Link></div></div>;
}
