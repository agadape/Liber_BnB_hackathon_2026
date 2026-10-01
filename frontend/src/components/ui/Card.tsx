import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-ink/8 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(16,30,26,0.25)] ${className}`}>
      {children}
    </div>
  );
}
