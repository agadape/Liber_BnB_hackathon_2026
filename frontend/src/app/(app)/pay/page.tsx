"use client";

import { useCallback, useState } from "react";
import { PageShell } from "@/components/ui/PageShell";
import { Button } from "@/components/ui/Button";
import { QrScanner } from "@/components/QrScanner";
import { QuoteCard } from "@/components/QuoteCard";
import { parseQRIS } from "@/lib/qris/parser";
import { getQuote, logScan, type Quote } from "@/lib/api";
import Link from "next/link";
import { CopilotCard, type Inspection } from "@/components/CopilotCard";

const USER_ID_KEY = "liber:userId";

export default function PayPage() {
  const [merchant, setMerchant] = useState<{ name: string; city: string; amountIdr: string } | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [payload, setPayload] = useState("");

  const handleScan = useCallback(async (qrContent: string) => {
    try {
      const parsed = parseQRIS(qrContent);
      const userId = window.localStorage.getItem(USER_ID_KEY);
      if (!userId) throw new Error("No wallet found. Please restart the app.");

      let amountIdr: number;
      if (parsed.amount) {
        amountIdr = Number(parsed.amount);
      } else {
        const input = window.prompt(`Amount for ${parsed.merchantName} (Rp)`);
        if (!input) return;
        amountIdr = Number(input);
        if (!Number.isFinite(amountIdr) || amountIdr <= 0) {
          setError("Invalid amount. Enter a number greater than 0.");
          return;
        }
      }

      const checkRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/copilot/inspect`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: qrContent, amountIdr: amountIdr.toString() }), signal: AbortSignal.timeout(25_000),
      });
      const checked = await checkRes.json();
      if (!checkRes.ok) throw new Error(checked.error);
      setInspection(checked); setPayload(qrContent); setError(null);
      const result = checked.quote ?? await getQuote(amountIdr);
      setMerchant({ name: parsed.merchantName, city: parsed.merchantCity, amountIdr: amountIdr.toString() });
      setQuote(result);

      logScan(userId, {
        merchantName: parsed.merchantName,
        merchantCity: parsed.merchantCity,
        amountIdr: amountIdr.toString(),
        amountUsdc: result.amountUsdc,
      }).catch((err) => console.error("failed to log scan", err));
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  return (
    <PageShell>
      <h1 className="font-display text-2xl italic text-ink">Scan QRIS</h1>
      <div className="mt-6">
        {!quote && <QrScanner onScan={handleScan} onError={setError} />}
        {error && <p className="mt-4 text-center text-sm text-rose">{error}</p>}
        {quote && merchant && (
          <div className="flex flex-col gap-3">
            <QuoteCard merchantName={merchant.name} merchantCity={merchant.city} amountIdr={merchant.amountIdr} quote={quote} />
            {inspection && <CopilotCard inspection={inspection} payload={payload} onUpdate={setInspection} />}
            <Link href="/merchant" className="text-center text-sm text-emerald underline">Try a separate Liber test invoice</Link>
            <Button
              variant="ghost"
              onClick={() => {
                setQuote(null);
                setMerchant(null);
                setError(null);
                setInspection(null); setPayload("");
              }}
            >
              Scan Another Code
            </Button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
