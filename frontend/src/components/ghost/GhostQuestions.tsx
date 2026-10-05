import Image from "next/image";
import Link from "next/link";

const questions = [
  ["Does the merchant need internet?", "Yes. You prepare online first; the merchant stays online to verify and redeem. The buyer does not need to reconnect at claim time. Physical phone-off testing is still pending."],
  ["Can anyone cash my QR?", "Only the named merchant wallet can redeem. Keep the QR private: that merchant can claim as soon as they obtain a valid authorization. Ghost does not verify physical handover or delivery."],
  ["What if I lose the paper?", "Connect the original owner wallet to recover the reservation. Unused tokens are reclaimable at or after expiry. Losing the owner wallet key is not solved by paper recovery."],
  ["Is this real money or QRIS?", "This release uses BSC Testnet and MockUSDC with no cash value. It does not settle rupiah or pay arbitrary QRIS codes. The QRIS sandbox is a separate Liber experiment."],
] as const;

export function GhostQuestions() {
  return <section className="liber-questions" aria-labelledby="questions-title"><div className="questions-intro"><Image src="/illustrations/mascot-guide.jpg" alt="Liber's illustrated guide carrying a green satchel" width={1000} height={1000} sizes="(max-width:767px) 120px,180px" /><h2 id="questions-title">Before you<br /><em>go off-screen.</em></h2><Link href="/demo/funds" className="landing-text-link">Get test tokens <span aria-hidden="true">↗</span></Link></div><div className="questions-list">{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>;
}
