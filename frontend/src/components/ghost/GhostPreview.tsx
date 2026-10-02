import Image from "next/image";
import Link from "next/link";

export function GhostPreview({mode="issue"}:{mode?:"issue"|"redeem"|"history"}){
  const copy={
    issue:{label:"YOUR NEXT MOVE",title:<>Make room for<br/><em>life off-screen.</em></>,body:"One merchant. One amount. One claim.",link:"Get test tokens",href:"/demo/funds"},
    redeem:{label:"THE MERCHANT SIDE",title:<>A piece of paper.<br/><em>One verified claim.</em></>,body:"Check the code. Claim to your wallet.",link:"Get TEST BNB for gas",href:"/demo/funds"},
    history:{label:"YOUR PAPER TRAIL",title:<>Lost the paper?<br/><em>Keep the trail.</em></>,body:"Your original wallet can recover a reservation and reclaim unused funds after expiry.",link:"Issue a voucher",href:"/ghost/create"},
  }[mode];
  return <aside className="ghost-preview ghost-no-print"><div className="ghost-preview-copy"><p className="page-eyebrow">{copy.label}</p><h2>{copy.title}</h2><p>{copy.body}</p></div><Image src="/illustrations/hero-success.jpg" width={1000} height={1000} sizes="(max-width:767px) 200px, 320px" alt="Liber's illustrated merchant holding a printed code" className="ghost-preview-art"/><div className="ghost-preview-foot"><span>Buyer offline.<br/>Merchant online.</span><Link href={copy.href}>{copy.link} <span aria-hidden="true">↗</span></Link></div></aside>;
}
