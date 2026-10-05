"use client";

import { useState } from "react";
import Link from "next/link";

const stages = [
  { label: "Prepare", title: "Give the permission its limits.", body: "Choose the merchant, amount and expiry. Sign online and reserve the exact tokens in the vault.", note: "The buyer needs internet and TEST BNB here.", action: "Issue a voucher", href: "/ghost/create", stamp: "Owner online", fields: [["Recipient", "One chosen merchant"], ["Amount", "Exactly what you reserve"], ["Expiry", "Chosen before signing"]] },
  { label: "Carry", title: "Take the permission off-screen.", body: "Export the funded voucher. Keep its QR private, then hand it to the merchant you chose.", note: "A paper or saved-image handover is possible. Physical phone-off testing is pending.", action: "See your vouchers", href: "/ghost/vouchers", stamp: "Private handover", fields: [["Inside the QR", "Limited authorization"], ["Stays with you", "Your wallet private key"], ["Can claim", "The named merchant only"]] },
  { label: "Claim", title: "One merchant. One claim.", body: "The merchant checks the reservation and redeems before expiry. The vault sends the exact tokens once.", note: "The merchant needs internet, their receiving wallet and TEST BNB gas.", action: "Redeem a voucher", href: "/ghost/merchant", stamp: "Merchant online", fields: [["Recipient", "Cannot be changed"], ["Second scan", "Cannot create another payment"], ["Payment proof", "Event and token transfer"]] },
  { label: "Recover", title: "Unused is not lost.", body: "After expiry, the original owner can reclaim an unused reservation with a transaction from their wallet.", note: "Reclaim is not automatic. Early cancellation is unavailable.", action: "See your vouchers", href: "/ghost/vouchers", stamp: "Owner recovery", fields: [["Who can reclaim", "The original owner"], ["When", "At or after expiry"], ["Destination", "The original owner wallet"]] },
] as const;

export function GhostWalkthrough() {
  const [selected, setSelected] = useState(0);
  const stage = stages[selected];
  return <section className="liber-walkthrough" aria-labelledby="walkthrough-title">
    <div className="liber-section-title"><h2 id="walkthrough-title">A little planning.<br /><em>A lot less screen.</em></h2><p>Follow the permission from your wallet to the merchant.</p></div>
    <div className="walkthrough-layout">
      <nav className="walkthrough-switch" aria-label="Explore the voucher lifecycle">
        {stages.map((item, index) => <button key={item.label} type="button" aria-pressed={selected === index} aria-controls="walkthrough-content" onClick={() => setSelected(index)}><span>{item.label}</span><span aria-hidden="true">↗</span></button>)}
      </nav>
      <div className="walkthrough-content" id="walkthrough-content">
        <div className="walkthrough-copy"><h3>{stage.title}</h3><p>{stage.body}</p><Link href={stage.href} className="landing-text-link">{stage.action} <span aria-hidden="true">↗</span></Link></div>
        <div className="permission-spec" key={stage.label}><div className="permission-spec-heading"><span>{stage.stamp}</span><span aria-hidden="true">↘</span></div><dl>{stage.fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p>Protocol guide, not a signed or funded voucher.</p></div>
      </div>
    </div>
    <p className="walkthrough-note" role="status">{stage.note}</p>
  </section>;
}
