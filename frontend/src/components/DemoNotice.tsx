import { IS_TESTNET } from "@/lib/chain";

export function DemoNotice() {
  return (
    <div role="note" className="border-b border-amber/30 bg-amber/15 px-5 py-3 text-center text-xs leading-relaxed text-ink/80">
      {IS_TESTNET ? <><strong>BSC Testnet Demo · MockUSDC</strong><br />Test transfers have no monetary value and do not fund a real Kolo card or pay a QRIS merchant.</> :
        <><strong>Payment route prototype</strong><br />Kolo deposit support and card payment compatibility must be confirmed with the provider before using real funds.</>}
    </div>
  );
}
