"use client";

import { useEffect, useState } from "react";
import type { Quote } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

import { IS_TESTNET } from "@/lib/chain";

const QUOTE_WINDOW_SECONDS = 30;

export function QuoteCard({
  merchantName,
  merchantCity,
  amountIdr,
  quote,
}: {
  merchantName: string;
  merchantCity: string;
  amountIdr: string;
  quote: Quote;
}) {
  const [secondsLeft, setSecondsLeft] = useState(QUOTE_WINDOW_SECONDS);

  useEffect(() => {
    const expiresAt = new Date(quote.expiresAt).getTime();
    const interval = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    }, 500);
    return () => clearInterval(interval);
  }, [quote.expiresAt]);

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink/65">
          {merchantName} &middot; {merchantCity}
        </p>
        <p className="mt-2 font-display text-4xl italic text-ink tabular-nums">
          Rp {Number(amountIdr).toLocaleString("en-US")}
        </p>
        <p className="mt-1 text-sm text-ink/60 tabular-nums">&asymp; {quote.amountUsdc} USDC</p>
      </div>

      <div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-emerald transition-[width] duration-500"
            style={{ width: `${(secondsLeft / QUOTE_WINDOW_SECONDS) * 100}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-ink/65">Estimated reference rate · refresh in {secondsLeft}s</p>
      </div>

      <a href="gojek://gopay" className="w-full">
        <Button>{IS_TESTNET ? "Open GoPay (outside demo)" : "Open GoPay"}</Button>
      </a>
      <p className="text-center text-xs text-ink/65">
        This quote is a reference estimate. The demo does not pay the merchant or fund a card; Kolo and QRIS card compatibility requires provider confirmation.
      </p>
    </Card>
  );
}
