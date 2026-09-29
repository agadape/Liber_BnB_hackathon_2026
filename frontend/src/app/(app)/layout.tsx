"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/nav/BottomNav";
import { useSessionStatus } from "@/lib/useSessionStatus";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useSessionStatus();

  useEffect(() => {
    if (session === false) {
      router.replace("/");
    }
  }, [router, session]);

  if (session !== true) return null;

  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
