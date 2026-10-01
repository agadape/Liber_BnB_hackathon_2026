"use client";
import { IS_TESTNET } from "@/lib/chain";
import { usePathname } from "next/navigation";

export function DemoNotice() {
  if (usePathname() === "/") return null;
  return <div role="note" className="environment-note landing-container">{IS_TESTNET ? "Test environment. No real-money payments." : "Payment prototype. Check the environment before using funds."}</div>;
}
