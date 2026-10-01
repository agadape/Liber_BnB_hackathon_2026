import { TOKEN_LABEL } from "@/lib/chain";
export function GradientBalanceCard({ usdcBalance, idrEstimate }: { usdcBalance: string; idrEstimate: string }) {
  return <div className="balance-panel"><p className="text-sm">Your balance</p><p className="mt-3 break-words text-4xl font-semibold tabular-nums">{usdcBalance} <span className="text-base font-normal">{TOKEN_LABEL}</span></p><p className="mt-3 text-xs tabular-nums">Reference estimate: Rp {Number(idrEstimate).toLocaleString("en-US")}</p></div>;
}
