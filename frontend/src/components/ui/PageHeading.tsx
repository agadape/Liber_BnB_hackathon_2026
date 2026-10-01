import type { ReactNode } from "react";
export function PageHeading({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return <div className="page-heading">{eyebrow && <p className="page-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{children && <div className="page-description">{children}</div>}</div>;
}
