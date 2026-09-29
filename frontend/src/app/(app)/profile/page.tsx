"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";
import { isAddress, getAddress, type Address } from "viem";
import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QrScanner } from "@/components/QrScanner";
import { getActiveWallet, sendActiveWallet, type ActiveWallet } from "@/lib/wallet/activeWallet";
import { buildTopUpTx } from "@/lib/wallet/topup";
import { saveKoloAddress, logTopup, getUserIdByAddress } from "@/lib/api";
import { USDC_ADDRESS, USDC_DECIMALS, explorerTxUrl } from "@/lib/chain";

const USER_ID_KEY = "liber:userId";
const KOLO_ADDRESS_KEY = "liber:koloAddress";

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<ActiveWallet | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const [koloAddress, setKoloAddress] = useState<string | null>(null);
  const [editingKolo, setEditingKolo] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getActiveWallet().then(async (activeWallet) => {
      setUserId(window.localStorage.getItem(USER_ID_KEY));
      setKoloAddress(window.localStorage.getItem(KOLO_ADDRESS_KEY));
      setWallet(activeWallet);
      setAddress(activeWallet.publicKey);
      setQrDataUrl(await QRCode.toDataURL(activeWallet.publicKey));

      // The backend keeps the Kolo address even after this device's local
      // cache is cleared (e.g. Log Out) - reconcile so it doesn't look "lost".
      try {
        const match = await getUserIdByAddress(activeWallet.publicKey);
        if (match?.koloAddress) {
          window.localStorage.setItem(KOLO_ADDRESS_KEY, match.koloAddress);
          setKoloAddress(match.koloAddress);
        }
      } catch {
        // Best-effort reconciliation; fall back to whatever's already cached locally.
      }
    });
  }, []);

  function handleConnect(rawAddress: string) {
    setError(null);
    // Kolo's QR may carry an EIP-681 style "ethereum:0x...@56" URI; keep just the address part.
    const candidate = rawAddress.trim().replace(/^ethereum:/i, "").split(/[@?/]/)[0];
    if (!isAddress(candidate)) {
      setError("Invalid Kolo address. It should be a BNB Chain (BEP-20) address starting with 0x.");
      return;
    }
    const addressValue = getAddress(candidate);

    window.localStorage.setItem(KOLO_ADDRESS_KEY, addressValue);
    setKoloAddress(addressValue);
    setEditingKolo(false);
    if (userId) saveKoloAddress(userId, addressValue).catch((err) => console.error("failed to save Kolo address", err));
  }

  function handleStartEditKolo() {
    setError(null);
    setAddressInput(koloAddress ?? "");
    setEditingKolo(true);
  }

  async function handleTopUp() {
    setError(null);
    setSuccess(null);
    const amountUsdc = Number(amountInput);
    if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) {
      setError("Invalid amount. Enter a number greater than 0.");
      return;
    }
    const amountUsdcRounded = (Math.floor(amountUsdc * 100) / 100).toFixed(2);
    if (Number(amountUsdcRounded) <= 0) {
      setError("Amount too small. Minimum is 0.01 USDC.");
      return;
    }
    if (!userId || !koloAddress || !wallet) return;

    setSubmitting(true);
    try {
      if (!USDC_ADDRESS) throw new Error("USDC token address is not configured (NEXT_PUBLIC_USDC_ADDRESS).");
      const tx = buildTopUpTx({
        usdcAddress: USDC_ADDRESS,
        destinationAddress: koloAddress as Address,
        amountUsdc: amountUsdcRounded,
        decimals: USDC_DECIMALS,
      });
      const txHash = await sendActiveWallet(wallet, tx);

      await logTopup(userId, { amountUsdc: amountUsdcRounded, txHash });
      setSuccess(`Sent ${amountUsdcRounded} USDC to Kolo. View on BscScan: ${explorerTxUrl(txHash)}`);
      setAmountInput("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <h1 className="font-display text-2xl italic text-ink">Profile</h1>

      <Card className="mt-6 flex flex-col items-center gap-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Your Wallet</p>
        {address ? (
          <>
            <div className="rounded-3xl bg-ink p-4">
              {qrDataUrl && <img src={qrDataUrl} alt="BNB Chain address" width={160} height={160} />}
            </div>
            <p className="break-all rounded-2xl bg-paper px-4 py-3 font-mono text-xs text-ink/70">{address}</p>
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(address);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? "Copied" : "Copy Address"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-ink/60">Loading address...</p>
        )}
      </Card>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-ink/50">Kolo Card</p>

      {!koloAddress && (
        <Card className="mt-3 flex flex-col gap-4 bg-emerald/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-deep">New to Kolo?</p>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                <Image src="/logos/kolo-logo.png" alt="Kolo" width={26} height={26} className="rounded-full" />
              </span>
              <p className="text-sm text-ink/70">
                <span className="font-semibold text-ink">1. Sign up for Kolo.</span> Get your card and its BNB Chain
                (BEP-20) USDC deposit address.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center gap-0.5 rounded-full bg-white shadow-sm">
                <Image src="/logos/gopay-logo.png" alt="GoPay" width={16} height={16} className="object-contain" />
                <Image src="/logos/dana-logo.png" alt="DANA" width={16} height={16} className="rounded object-contain" />
              </span>
              <p className="text-sm text-ink/70">
                <span className="font-semibold text-ink">2. Link the card.</span> In GoPay or DANA, add that Kolo
                Visa card under payment methods.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald text-white shadow-sm">
                <span className="font-display text-sm italic">3</span>
              </span>
              <p className="text-sm text-ink/70">
                <span className="font-semibold text-ink">Connect here.</span> Paste or scan the Kolo address below.
              </p>
            </div>
          </div>

          <a
            href="https://kolo.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-sm font-semibold text-emerald underline underline-offset-4"
          >
            Sign up at kolo.xyz
          </a>
        </Card>
      )}

      {!koloAddress || editingKolo ? (
        <Card className="mt-3 flex flex-col gap-4">
          <p className="text-sm text-ink/60">
            Connect your Kolo BNB Chain (BEP-20) USDC deposit address. USDC sent there can be spent immediately
            through your Kolo card linked to GoPay or DANA.
          </p>
          {scanning ? (
            <QrScanner
              onScan={(text) => {
                setScanning(false);
                setAddressInput(text);
              }}
              onError={setError}
            />
          ) : (
            <>
              <input
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="Kolo BNB Chain address (0x...)"
                className="w-full rounded-2xl bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 outline-none ring-1 ring-transparent focus:ring-emerald"
              />
              <Button onClick={() => handleConnect(addressInput)} disabled={!addressInput}>
                Connect
              </Button>
              <Button variant="ghost" onClick={() => setScanning(true)}>
                Scan Kolo QR
              </Button>
              {koloAddress && (
                <Button variant="ghost" onClick={() => setEditingKolo(false)}>
                  Cancel
                </Button>
              )}
            </>
          )}
        </Card>
      ) : (
        <Card className="mt-3 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <p className="break-all font-mono text-xs text-ink/50">{koloAddress}</p>
            </div>
            <button
              type="button"
              onClick={handleStartEditKolo}
              className="shrink-0 text-xs font-semibold text-emerald underline underline-offset-4"
            >
              Edit
            </button>
          </div>
          <input
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="Amount (USDC)"
            inputMode="decimal"
            className="w-full rounded-2xl bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 outline-none ring-1 ring-transparent focus:ring-emerald"
          />
          <Button onClick={handleTopUp} disabled={submitting || !amountInput || !wallet}>
            {submitting ? "Sending..." : "Top Up Kolo"}
          </Button>
        </Card>
      )}

      {error && <p className="mt-4 text-center text-sm text-rose">{error}</p>}
      {success && <p className="mt-4 text-center text-sm text-emerald">{success}</p>}
    </PageShell>
  );
}
