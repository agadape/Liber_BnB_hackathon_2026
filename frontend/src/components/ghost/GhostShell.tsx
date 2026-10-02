"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import type {ReactNode} from "react";
import {PageShell} from "../ui/PageShell";
const routes=[{href:"/ghost",label:"Overview"},{href:"/ghost/create",label:"Issue"},{href:"/ghost/merchant",label:"Redeem"},{href:"/ghost/vouchers",label:"My vouchers"}];
export function GhostShell({title,eyebrow="GHOST WORKSPACE",description,landing=false,children}:{title:string;eyebrow?:string;description?:string;landing?:boolean;children:ReactNode}) {
  const path=usePathname();
  return <PageShell wide><div className={`ghost-workspace${landing?" ghost-workspace--landing":""}`}>
    <div className="ghost-topline ghost-no-print">
      <Link className="ghost-wordmark" href="/ghost"><span className="ghost-mark" aria-hidden="true">g.</span><span>Ghost Protocol<small>BY LIBER / BUILT ON BNB</small></span></Link>
      <nav aria-label="Ghost navigation">{routes.map(route=><Link key={route.href} href={route.href} aria-current={(path===route.href||(route.href==="/ghost/create"&&path==="/ghost/voucher"))?"page":undefined}>{route.label}</Link>)}</nav>
    </div>
    {!landing&&<header className="page-heading ghost-no-print"><p className="page-eyebrow">{eyebrow}</p><h1>{title}</h1>{description&&<p className="page-description">{description}</p>}<p className="ghost-environment"><span aria-hidden="true"/>BSC Testnet · MockUSDC · No cash value</p></header>}
    {children}
  </div></PageShell>;
}
