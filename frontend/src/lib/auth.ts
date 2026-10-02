import { getAddress } from "viem";
import { createSiweMessage } from "viem/siwe";
import { CHAIN } from "./chain";
import { getActiveWallet, signActiveWallet, type ActiveWallet } from "./wallet/activeWallet";
import { clearGhostSignatures } from "./ghost/storage";

const SESSION_KEY = "liber:apiSession";
const STATEMENT = "Sign in to Liber. This does not authorize a transfer or grant access to your funds.";
interface Session { token: string; walletAddress: string; expiresAt: string }
export interface Challenge { nonce: string; walletAddress: string; domain: string; uri: string; chainId: number; issuedAt: string; expiresAt: string }
let pending: { address: string; promise: Promise<Session> } | undefined;
let generation = 0;

export function challengeMessage(challenge: Challenge, walletAddress: string, origin: string, now = Date.now()): string {
  const issued = Date.parse(challenge.issuedAt), expires = Date.parse(challenge.expiresAt);
  const expectedOrigin = new URL(origin);
  if (challenge.domain !== expectedOrigin.host || challenge.uri !== expectedOrigin.origin || challenge.chainId !== CHAIN.id ||
      getAddress(challenge.walletAddress) !== getAddress(walletAddress) || !/^[a-f0-9]{32}$/.test(challenge.nonce) ||
      !Number.isFinite(issued) || !Number.isFinite(expires) || issued > now + 30_000 ||
      expires <= now || expires - issued > 5 * 60_000 || expires <= issued)
    throw new Error("The wallet sign-in request is invalid or expired. Please try again.");
  return createSiweMessage({ address: getAddress(walletAddress), domain: challenge.domain, uri: challenge.uri,
    version: "1", chainId: challenge.chainId, nonce: challenge.nonce, issuedAt: new Date(issued),
    expirationTime: new Date(expires), statement: STATEMENT });
}

export function clearApiSession() {
  generation++; pending = undefined;
  window.sessionStorage.removeItem(SESSION_KEY); clearGhostSignatures(window.sessionStorage);
  window.dispatchEvent(new Event("liber:ghost-clear-sensitive"));
}

export async function authenticateWallet(walletOverride?: ActiveWallet): Promise<Session> {
  const wallet = walletOverride ?? await getActiveWallet();
  const address = getAddress(wallet.publicKey);
  const base = process.env.NEXT_PUBLIC_BACKEND_URL!;
  try {
    const saved: Session = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) ?? "null");
    if (saved && saved.walletAddress === address && Date.parse(saved.expiresAt) > Date.now() + 10_000) return saved;
  } catch { /* Invalid cached sessions are replaced. */ }
  if (pending?.address === address) return pending.promise;
  const startedGeneration = generation;
  const promise = (async () => {
    const challengeRes = await fetch(`${base}/auth/challenge`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ walletAddress: address }) });
    if (!challengeRes.ok) throw new Error("Could not request wallet sign-in. Please try again.");
    const challenge: Challenge = await challengeRes.json();
    const message = challengeMessage(challenge, address, window.location.origin);
    const signature = await signActiveWallet(wallet, message);
    const res = await fetch(`${base}/auth/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nonce: challenge.nonce, signature }) });
    if (!res.ok) throw new Error("Wallet sign-in failed. Please try again.");
    const session: Session = await res.json();
    if (session.walletAddress !== address || !/^[a-f0-9]{64}$/.test(session.token) || Date.parse(session.expiresAt) <= Date.now())
      throw new Error("Invalid wallet session");
    if (startedGeneration !== generation) throw new Error("Wallet changed while signing in. Please try again.");
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  })();
  pending = { address, promise };
  try { return await promise; } finally { if (pending?.promise === promise) pending = undefined; }
}

export const authenticatedFetch: typeof fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input), window.location.origin);
  if (url.origin !== new URL(process.env.NEXT_PUBLIC_BACKEND_URL!).origin)
    throw new Error("Wallet sessions can only be sent to the Liber API.");
  const session = await authenticateWallet();
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${session.token}`);
  const res = await fetch(input, { ...init, headers, cache: "no-store" });
  if (res.status === 401) {
    clearApiSession();
    window.dispatchEvent(new Event("liber:auth-required"));
    throw new Error("Your wallet session expired. Reconnect your wallet to continue.");
  }
  return res;
};

export async function signOutApi() {
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  clearApiSession();
  if (!raw) return;
  const session: Session = JSON.parse(raw);
  await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${session.token}` } });
}

export async function hasApiSession(): Promise<boolean> {
  try {
    const wallet = await getActiveWallet();
    const session: Session = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) ?? "null");
    return !!session && session.walletAddress === getAddress(wallet.publicKey) && Date.parse(session.expiresAt) > Date.now() + 10_000;
  } catch { return false; }
}
