import type { ReactNode } from "react";

export function PageShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <main id="main-content" className={`product-page ${wide ? "product-page-wide" : ""}`}><div className="product-container">{children}</div></main>;
}
