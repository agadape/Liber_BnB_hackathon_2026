"use client";

import { useEffect, useRef, useState } from "react";
import { registerWalletChooser, type WalletOption } from "@/lib/wallet/providers";
import { Button } from "./ui/Button";

/** One picker shared by onboarding, invoices and the QRIS pilot. */
export function WalletPicker() {
  const [options, setOptions] = useState<WalletOption[] | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const resolve = useRef<((choice: WalletOption | null) => void) | null>(null);

  useEffect(() => {
    const unregister = registerWalletChooser(choices => new Promise(done => {
      resolve.current?.(null);
      resolve.current = done;
      setOptions(choices);
    }));
    return () => { unregister(); resolve.current?.(null); resolve.current = null; };
  }, []);
  useEffect(() => {
    if (options && !dialog.current?.open) dialog.current?.showModal();
    if (!options && dialog.current?.open) dialog.current.close();
  }, [options]);

  function finish(choice: WalletOption | null) {
    resolve.current?.(choice);
    resolve.current = null;
    setOptions(null);
  }

  return <dialog ref={dialog} aria-labelledby="wallet-picker-title" onCancel={event => { event.preventDefault(); finish(null); }}
    className="m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-2xl border border-ink/15 bg-paper p-6 text-ink shadow-xl backdrop:bg-ink/40">
    <h2 id="wallet-picker-title" className="font-display text-2xl italic">Choose your wallet</h2>
    <p className="mt-3 text-sm text-ink/65">Select an unlocked account. Merchant sign-in requires the configured merchant wallet.</p>
    <div className="mt-5 flex flex-col gap-3">{options?.map((option, index) => <Button key={`${option.id}:${index}`} onClick={() => finish(option)}>{option.name}</Button>)}</div>
    <Button variant="ghost" className="mt-4" onClick={() => finish(null)}>Cancel</Button>
  </dialog>;
}
