import type {ReactNode} from "react";
export function PageHeading({eyebrow,title,children}:{eyebrow:string;title:string;children?:ReactNode}){
  return <div className="mb-6"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald">{eyebrow}</p><h1 className="mt-2 font-display text-4xl leading-tight tracking-tight sm:text-5xl">{title}</h1>{children&&<div className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/65">{children}</div>}</div>;
}
