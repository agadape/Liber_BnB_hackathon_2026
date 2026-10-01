import Image from "next/image";
import type { ReactNode } from "react";

export function WorkspaceGuide({ title, children }: { title: string; children: ReactNode }) {
  return <div className="workspace-guide"><Image src="/illustrations/mascot-guide.jpg" alt="Liber's illustrated guide" width={1000} height={1000} sizes="(max-width: 767px) 100px, 120px" /><div><h2>{title}</h2><p>{children}</p></div></div>;
}
