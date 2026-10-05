import { PageShell } from "@/components/ui/PageShell";

export default function Loading() {
  return <PageShell wide><div className="liber-loading" role="status" aria-label="Loading your workspace"><span className="sr-only">Loading your workspace…</span><div className="skeleton-heading" /><div className="skeleton-line" /><div className="skeleton-panels"><div /><div /></div></div></PageShell>;
}
