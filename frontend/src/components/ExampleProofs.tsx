import Link from "next/link";
import { DEMO_LINKS } from "@/lib/demo-links";

export function ExampleProofs() {
  return <section className="example-proofs" aria-label="Completed test receipts"><h2>Completed receipts</h2><div><Link href={DEMO_LINKS.sandboxReceipt}><span>Rp10.000 <small>QRIS sandbox</small></span><span aria-hidden="true">↗</span></Link><Link href={DEMO_LINKS.tokenReceipt}><span>5 MockUSDC <small>BNB Testnet</small></span><span aria-hidden="true">↗</span></Link></div></section>;
}
