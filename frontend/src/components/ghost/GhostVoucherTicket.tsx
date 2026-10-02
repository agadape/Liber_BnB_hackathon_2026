"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { formatUnits, type Address, type Hex } from "viem";
import { encodePacket, voucherId, type GhostVoucher } from "@/lib/ghost/codec";
import { expiryLabel, safeGhostError } from "@/lib/ghost/transactions";
import { Button } from "../ui/Button";

export function GhostVoucherTicket({ vault, voucher, signature, beforeExport }: {
  vault: Address; voucher: GhostVoucher; signature: Hex; beforeExport: () => Promise<void>;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    let live = true;
    try {
      const packet = encodePacket(vault, voucher, signature);
      QRCode.toDataURL(packet, { width: 1200, margin: 4, errorCorrectionLevel: "H", color: { dark: "#101e1a", light: "#ffffff" } })
        .then(url => { if (live) setQr(url); }).catch(() => { if (live) setError("QR could not be generated."); });
    } catch { queueMicrotask(() => { if (live) setError("QR could not be generated."); }); }
    const timer = window.setInterval(() => setExpired(BigInt(Math.floor(Date.now() / 1000)) + 60n >= voucher.validBefore), 1000);
    return () => { live = false; window.clearInterval(timer); };
  }, [vault, voucher, signature]);
  const id = voucherId(vault, voucher);
  async function exportTicket(print: boolean) {
    if (!qr || busy || expired) return;
    setBusy(true); setError(null);
    try {
      // A previously funded QR may since have been claimed or expired.
      await beforeExport();
      if (print) window.print();
      else { const link = document.createElement("a"); link.href = qr; link.download = `liber-ghost-${id.slice(2, 10)}.png`; link.click(); }
    } catch (e) { setError(safeGhostError(e)); } finally { setBusy(false); }
  }
  return <>
    <article className="ghost-ticket" aria-label="Funded Ghost payment voucher">
      <div className="ghost-ticket-head"><span>liber:Ghost Protocol</span><span>01 / PAPER PAYMENT</span></div>
      <div className="ghost-ticket-amount">{formatUnits(voucher.amount, 18)}<small>MockUSDC · test tokens</small></div>
      <p className="ghost-ticket-caption">Ready when your phone isn&apos;t.</p>
      {/* This QR is created locally; it must never be requested from an image service. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {qr && !expired ? <img src={qr} alt="Signed, merchant-bound Ghost voucher" className="ghost-ticket-qr" width={1200} height={1200} /> : <p role="status">{expired ? "Expiry is too close for a new handover. Check your voucher history." : error ?? "Preparing your paper voucher…"}</p>}
      <dl className="ghost-ticket-details"><dt>Merchant wallet</dt><dd className="ghost-address">{voucher.merchant}</dd><dt>Valid before</dt><dd>{expiryLabel(voucher.validBefore)}</dd><dt>Voucher ID</dt><dd className="ghost-address">{id}</dd></dl>
      <p className="ghost-ticket-warning">BSC TESTNET — NO CASH VALUE<br />Merchant must be online to redeem.<br />Handing over this code authorizes the named merchant to claim it.<br />Not a QRIS payment code.</p>
    </article>
    <div className="ghost-no-print ghost-export-actions">
      <Button disabled={!qr || busy || expired} onClick={() => exportTicket(true)}>{busy ? "Checking chain state…" : "Print voucher"}</Button>
      <Button variant="ghost" disabled={!qr || busy || expired} onClick={() => exportTicket(false)}>Save QR PNG</Button>
      {error && <p role="alert" className="ghost-error">{error}</p>}
      <p>Keep this code private until handover. Its recipient and amount are fixed; the merchant can claim it as soon as they receive it.</p>
    </div>
  </>;
}
