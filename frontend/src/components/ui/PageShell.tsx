import type { ReactNode } from "react";

export function PageShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <main id="main-content" className="relative overflow-x-hidden bg-paper text-ink">
      <div className="liber-mesh" />
      <div className={`relative mx-auto flex w-full flex-col px-5 pb-28 pt-7 sm:px-8 sm:pt-10 ${wide ? "max-w-6xl" : "max-w-xl"}`}>
        {children}
      </div>
    </main>
  );
}
