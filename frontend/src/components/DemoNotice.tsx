"use client";
import { IS_TESTNET } from "@/lib/chain";
import { usePathname } from "next/navigation";

export function DemoNotice() {
  const pathname = usePathname();
  // The landing header and footer carry the environment notice together.
  if (pathname === "/") return null;
  return (
    <div role="note" className="bg-emerald-deep px-4 py-2 text-center text-[11px] text-white/85">
      {IS_TESTNET ? <><strong className="text-gold">BNB Smart Chain · Testnet</strong><span className="mx-2 text-white/30">/</span>Hackathon sandbox · no real-money payments</> : <><strong>Payment route prototype</strong> · check the payment environment before using funds</>}
    </div>
  );
}
