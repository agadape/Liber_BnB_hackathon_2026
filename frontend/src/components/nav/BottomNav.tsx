"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, ScanIcon, ProfileIcon, HistoryIcon, SettingsIcon } from "@/components/icons";

const TABS = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/history", label: "History", Icon: HistoryIcon },
  { href: "/pay", label: "Scan", Icon: ScanIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
] as const;
export function BottomNav() {
  const pathname = usePathname();
  return <nav aria-label="Wallet navigation" className="wallet-navigation"><div>{TABS.map(({ href, label, Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}><Icon /><span>{label}</span></Link>)}</div></nav>;
}
