import Link from "next/link";
import type {ReactNode} from "react";
import {PageShell} from "../ui/PageShell";
export function GhostShell({title,eyebrow="liber:Ghost Protocol",children}:{title:string;eyebrow?:string;children:ReactNode}) {
  return <PageShell wide><div className="ghost-topline ghost-no-print"><Link href="/ghost">Ghost Protocol</Link><nav aria-label="Ghost navigation"><Link href="/ghost/create">Issue</Link><Link href="/ghost/merchant">Redeem</Link><Link href="/ghost/vouchers">My vouchers</Link></nav></div><div className="page-heading ghost-no-print"><p className="page-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="ghost-environment">BSC Testnet · MockUSDC has no cash value</p></div>{children}</PageShell>;
}
