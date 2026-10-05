import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";

export default function NotFound() {
  return <PageShell wide><section className="liber-fallback"><div><p className="page-eyebrow">Page not found</p><h1>This paper trail<br />ends here.</h1><p>The link may be incomplete or the page may have moved. Your wallet has not been changed.</p><Link href="/ghost" className="landing-primary">Ghost workspace <span aria-hidden="true">↗</span></Link><Link href="/" className="landing-text-link">Back to Liber</Link></div><Image src="/illustrations/mascot-guide.jpg" alt="Liber's illustrated guide looking for the way forward" width={1000} height={1000} sizes="(max-width:767px) 240px,320px" /></section></PageShell>;
}
