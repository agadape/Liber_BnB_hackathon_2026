import type { EIP1193Provider } from "viem";

export type WalletOption = { id: string; name: string; provider: EIP1193Provider };
type Injected = EIP1193Provider & { providers?: Injected[]; isMetaMask?: boolean; isRabby?: boolean; isTrust?: boolean; isBinance?: boolean };
const PROVIDER_KEY = "liber:wallet:provider";
let discoveryWindow: Window | undefined;
const announced = new Map<string, WalletOption>();
let selected: WalletOption | undefined;
let chooser: ((options: WalletOption[]) => Promise<WalletOption | null>) | undefined;

export function registerWalletChooser(handler: NonNullable<typeof chooser>) {
  chooser = handler;
  return () => { if (chooser === handler) chooser = undefined; };
}

function remember(id: string | null) {
  try {
    if (id) window.localStorage.setItem(PROVIDER_KEY, id);
    else window.localStorage.removeItem(PROVIDER_KEY);
  } catch { /* A blocked storage setting must not prevent connecting. */ }
}

export async function discoverWallets(): Promise<WalletOption[]> {
  if (typeof window === "undefined") return [];
  if (discoveryWindow !== window) {
    discoveryWindow = window;
    announced.clear();
    selected = undefined;
    // Listen for late announcements for the lifetime of this page (EIP-6963).
    window.addEventListener("eip6963:announceProvider", event => {
      const detail = (event as CustomEvent).detail;
      if (!detail || typeof detail.info?.uuid !== "string" || typeof detail.info?.rdns !== "string" ||
          typeof detail.info?.name !== "string" || typeof detail.provider?.request !== "function") return;
      announced.set(detail.info.uuid, { id: detail.info.rdns, name: detail.info.name.slice(0, 60), provider: detail.provider });
    });
  }
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  await new Promise(resolve => setTimeout(resolve, 150));
  const options = [...announced.values()];
  const injected = (window as Window & { ethereum?: Injected }).ethereum;
  const legacy = injected?.providers?.length ? injected.providers : injected ? [injected] : [];
  for (const [index, eth] of legacy.entries()) {
    if (typeof eth.request !== "function" || options.some(option => option.provider === eth)) continue;
    const name = eth.isRabby ? "Rabby" : eth.isTrust ? "Trust Wallet" : eth.isBinance ? "Binance Wallet" : eth.isMetaMask ? "MetaMask" : "Browser wallet";
    options.push({ id: `legacy:${name}:${index}`, name, provider: eth });
  }
  return options;
}

export async function chooseWalletProvider(): Promise<EIP1193Provider> {
  const options = await discoverWallets();
  if (!options.length) throw new Error("No browser wallet found. Open Liber in Chrome with MetaMask enabled, or inside your wallet's browser.");
  const choice = chooser ? await chooser(options) : options.length === 1 ? options[0] : null;
  if (!choice) throw new Error(options.length > 1 && !chooser ? "Multiple wallets found. Reload Liber and choose your wallet." : "Wallet selection cancelled. Choose your wallet to try again.");
  if (!options.includes(choice)) throw new Error("Wallet selection changed. Please connect again.");
  selected = choice;
  remember(choice.id);
  return choice.provider;
}

/** Account reads and signing use the provider selected at connection time. */
export async function connectedProvider(): Promise<EIP1193Provider> {
  if (selected && discoveryWindow === window) return selected.provider;
  const options = await discoverWallets();
  let saved: string | null = null;
  try { saved = window.localStorage.getItem(PROVIDER_KEY); } catch { /* Storage optional. */ }
  const matches = saved ? options.filter(option => option.id === saved) : options;
  if (matches.length !== 1) throw new Error("Wallet disconnected. Choose your wallet and reconnect to Liber.");
  selected = matches[0];
  return selected.provider;
}

export function forgetWalletProvider() { selected = undefined; remember(null); }
