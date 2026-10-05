import Image from "next/image";
import Link from "next/link";

export function GhostPreview({mode="issue"}:{mode?:"issue"|"redeem"|"history"}){
  const copy={
    issue:{label:"YOUR NEXT MOVE",title:<>Make room for<br/><em>life off-screen.</em></>,body:"One merchant. One amount. One claim.",link:"Get test tokens",href:"/demo/funds"},
    redeem:{label:"THE MERCHANT SIDE",title:<>A piece of paper.<br/><em>One verified claim.</em></>,body:"Check the code. Claim to your wallet.",link:"Get TEST BNB for gas",href:"/demo/funds"},
    history:{label:"YOUR PAPER TRAIL",title:<>Lost the paper?<br/><em>Keep the trail.</em></>,body:"Your original wallet can recover a reservation and reclaim unused funds after expiry.",link:"Issue a voucher",href:"/ghost/create"},
  }[mode];
  const illustration=mode==="history"?"mascot-guide.jpg":mode==="issue"?"problem-hook.jpg":"hero-success.jpg";
  const alt=mode==="history"?"Liber's illustrated guide carrying a green satchel":mode==="issue"?"Comic illustration of a buyer and merchant separated by a wall":"Liber's illustrated merchant holding a printed code";
  return <aside className="ghost-preview ghost-no-print"><div className="ghost-preview-copy"><p className="page-eyebrow">{copy.label}</p><h2>{copy.title}</h2><p>{copy.body}</p></div><Image src={`/illustrations/${illustration}`} width={1000} height={1000} sizes="(max-width:767px) 200px,320px" alt={alt} className="ghost-preview-art"/><div className="ghost-preview-foot"><span>Buyer prepares online.<br/>Merchant redeems online.</span><Link href={copy.href}>{copy.link} <span aria-hidden="true">↗</span></Link></div><div className="ghost-preview-checklist"><h3>{mode==="issue"?"Before you reserve":mode==="redeem"?"Before you claim":"Keep your recovery route"}</h3><ul>{(mode==="issue"?["Have TEST BNB and MockUSDC.","Confirm the merchant’s receiving address.","Choose an expiry you can wait for."]:mode==="redeem"?["Connect the wallet named on the voucher.","Have TEST BNB for gas.","Verify the reservation before claiming."]:["Use the original owner wallet.","Keep the reservation transaction hash.","Unused funds are reclaimable after expiry."]).map(item=><li key={item}>{item}</li>)}</ul></div></aside>;
}
