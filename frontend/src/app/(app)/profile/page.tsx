"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { isAddress, getAddress, createPublicClient, http, type Address, type Hash } from "viem";
import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QrScanner } from "@/components/QrScanner";
import { getActiveWallet, sendActiveWallet, type ActiveWallet } from "@/lib/wallet/activeWallet";
import { buildTopUpTx } from "@/lib/wallet/topup";
import { saveKoloAddress, logTopup, getUserIdByAddress } from "@/lib/api";
import { USDC_ADDRESS, USDC_DECIMALS, explorerTxUrl, TOKEN_LABEL, IS_TESTNET, CHAIN, RPC_URL } from "@/lib/chain";

interface PendingTransfer { txHash: string; amountUsdc: string; destination: string }
const pendingKey = (address: string) => `liber:pendingTransfer:${CHAIN.id}:${address.toLowerCase()}`;

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<ActiveWallet | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState<PendingTransfer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const active = await getActiveWallet();
      const match = await getUserIdByAddress(active.publicKey);
      if (cancelled) return;
      setWallet(active);
      setUserId(match?.userId ?? null);
      setDestination(match?.koloAddress ?? null);
      setQrDataUrl(await QRCode.toDataURL(active.publicKey));
      const saved = window.sessionStorage.getItem(pendingKey(active.publicKey));
      if (saved) { try { setPending(JSON.parse(saved)); } catch { /* Ignore corrupt local cache. */ } }
    })().catch(err => { if (!cancelled) setError((err as Error).message); });
    return () => { cancelled = true; };
  }, []);

  async function handleConnect(raw: string) {
    setError(null); setSuccess(null);
    if (!userId || pending) return;
    const network = raw.trim().match(/^ethereum:[^@]*@(\d+)/i)?.[1];
    if (network && Number(network) !== CHAIN.id) { setError(`This QR uses another network. Use an address for ${CHAIN.name}.`); return; }
    const candidate = raw.trim().replace(/^ethereum:/i, "").split(/[@?/]/)[0];
    if (!isAddress(candidate) || /^0x0{40}$/i.test(candidate)) { setError("Enter a valid destination address starting with 0x."); return; }
    setSubmitting(true);
    try {
      const saved = await saveKoloAddress(userId, getAddress(candidate));
      // Use the authenticated server response, never an optimistic cached destination.
      setDestination(saved.koloAddress);
      window.localStorage.setItem("liber:koloAddress", saved.koloAddress);
      setEditing(false);
    } catch (err) { setError((err as Error).message); }
    finally { setSubmitting(false); }
  }

  async function recordTransfer(transfer: PendingTransfer) {
    if (!wallet || !userId) return;
    setError(null);
    const client = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });
    const receipt = await client.waitForTransactionReceipt({ hash: transfer.txHash as Hash, timeout: 90_000 });
    if (receipt.status !== "success") {
      window.sessionStorage.removeItem(pendingKey(wallet.publicKey));
      setPending(null);
      throw new Error("The transaction reverted. No token transfer was completed.");
    }
    await logTopup(userId, { amountUsdc: transfer.amountUsdc, txHash: transfer.txHash });
    window.sessionStorage.removeItem(pendingKey(wallet.publicKey));
    setPending(null);
    setSuccess(`Verified ${transfer.amountUsdc} ${TOKEN_LABEL} transfer.${IS_TESTNET ? " This did not fund a real Kolo card." : ""}`);
    setAmountInput("");
  }

  async function handleTopUp() {
    if (!wallet || !destination || !userId || pending) return;
    setError(null); setSuccess(null);
    if (!/^\d+(\.\d{1,2})?$/.test(amountInput) || Number(amountInput) <= 0) {
      setError("Enter a positive amount with up to two decimal places."); return;
    }
    const amount = amountInput;
    setSubmitting(true);
    let broadcast: PendingTransfer | undefined;
    try {
      if (!USDC_ADDRESS) throw new Error("Token contract is not configured.");
      const txHash = await sendActiveWallet(wallet, buildTopUpTx({ usdcAddress: USDC_ADDRESS, destinationAddress: destination as Address, amountUsdc: amount, decimals: USDC_DECIMALS }));
      broadcast = { txHash, amountUsdc: amount, destination };
      window.sessionStorage.setItem(pendingKey(wallet.publicKey), JSON.stringify(broadcast));
      setPending(broadcast);
      await recordTransfer(broadcast);
    } catch (err) {
      setError(broadcast ? `Transaction submitted. Check BscScan and retry verification with the same hash; do not send it again. ${(err as Error).message}` : (err as Error).message);
    } finally { setSubmitting(false); }
  }

  return (
    <PageShell>
      <h1 className="font-display text-2xl italic text-ink">Profile</h1>
      <Card className="mt-6 flex flex-col items-center gap-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Your Wallet · {CHAIN.name}</p>
        {wallet ? <>
          <div className="rounded-3xl bg-ink p-4">
            {qrDataUrl && <img src={qrDataUrl} alt="Your BNB wallet address" width={160} height={160} />}
          </div>
          <p className="break-all rounded-2xl bg-paper px-4 py-3 font-mono text-xs text-ink/70">{wallet.publicKey}</p>
          <Button variant="secondary" onClick={() => {
            navigator.clipboard.writeText(wallet.publicKey); setCopied(true); setTimeout(() => setCopied(false), 2000);
          }}>{copied ? "Copied" : "Copy Address"}</Button>
        </> : <p className="text-sm text-ink/60">Loading your wallet...</p>}
      </Card>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-ink/50">{IS_TESTNET ? "Test transfer destination" : "Transfer destination"}</p>
      <Card className="mt-3 flex flex-col gap-3 bg-emerald/5">
        <p className="text-sm text-ink/70">{IS_TESTNET ?
          "Use another test wallet that you control. MockUSDC has no monetary value and cannot load a Kolo card or pay a QRIS merchant." :
          "Confirm the exact network, token and deposit instructions with the recipient before sending."}</p>
        <p className="text-xs text-ink/50">The proposed Kolo → GoPay/DANA payment route remains a prototype. Provider support and card compatibility need to be validated before real use.</p>
        <a href="https://kolo.xyz" target="_blank" rel="noopener noreferrer" className="text-sm text-emerald underline">Learn about Kolo</a>
      </Card>
      {!destination || editing ? <Card className="mt-3 flex flex-col gap-4">
        <p className="text-sm text-ink/60">Save the destination for {TOKEN_LABEL} on {CHAIN.name}.</p>
        {scanning ? <QrScanner onScan={text => { setScanning(false); setAddressInput(text); }} onError={setError} /> : <>
          <input aria-label="Transfer destination address" value={addressInput} onChange={e => setAddressInput(e.target.value)} placeholder="Test wallet address (0x...)" className="w-full rounded-2xl bg-paper px-4 py-3 text-sm outline-none" />
          <Button onClick={() => handleConnect(addressInput)} disabled={!addressInput || submitting || !userId}>{submitting ? "Saving..." : "Save destination"}</Button>
          <Button variant="ghost" onClick={() => setScanning(true)}>Scan destination QR</Button>
          {destination && <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>}
        </>}
      </Card> : <Card className="mt-3 flex flex-col gap-4">
        <p className="text-xs text-ink/60">Check the full destination before you sign.</p>
        <p className="break-all font-mono text-xs text-ink/70">{destination}</p>
        <Button variant="ghost" disabled={!!pending || submitting} onClick={() => { setAddressInput(destination); setEditing(true); }}>Edit destination</Button>
        <input aria-label={`Amount in ${TOKEN_LABEL}`} value={amountInput} onChange={e => setAmountInput(e.target.value)} placeholder={`Amount (${TOKEN_LABEL})`} inputMode="decimal" className="w-full rounded-2xl bg-paper px-4 py-3 text-sm outline-none" />
        <Button onClick={handleTopUp} disabled={submitting || !!pending || !amountInput || !wallet}>{submitting ? "Confirming..." : IS_TESTNET ? "Send test MockUSDC" : "Send USDC"}</Button>
      </Card>}
      {pending && <Card className="mt-4 flex flex-col gap-3">
        <p className="text-sm text-ink/70">Transfer submitted. Verification can be retried without sending tokens again.</p>
        <a href={explorerTxUrl(pending.txHash)} target="_blank" rel="noopener noreferrer" className="break-all text-xs text-emerald underline">View transaction on BscScan</a>
        <Button disabled={submitting} onClick={async () => {
          setSubmitting(true);
          try { await recordTransfer(pending); } catch (err) { setError((err as Error).message); }
          finally { setSubmitting(false); }
        }}>Retry verification</Button>
      </Card>}
      {error && <p role="alert" className="mt-4 text-center text-sm text-rose">{error}</p>}
      {success && <p role="status" className="mt-4 text-center text-sm text-emerald">{success}</p>}
    </PageShell>
  );
}
