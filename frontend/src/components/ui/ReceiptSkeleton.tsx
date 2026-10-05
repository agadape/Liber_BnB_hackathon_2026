export function ReceiptSkeleton({ label = "Reading public evidence…" }: { label?: string }) {
  return <div className="receipt-skeleton" role="status"><span className="sr-only">{label}</span><div aria-hidden="true"><span/><span/><span/><span/></div></div>;
}
