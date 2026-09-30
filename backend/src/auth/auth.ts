import { createHash, randomBytes } from "node:crypto";
import { Hono, type MiddlewareHandler, type Context } from "hono";
import { getAddress, isAddress, verifyMessage, type Hex } from "viem";
import { createSiweMessage } from "viem/siwe";
import { getPool } from "../db/pool.js";

const NONCE_TTL_MS = 5 * 60_000;
const SESSION_TTL_MS = 30 * 60_000;
export const AUTH_STATEMENT = "Sign in to Liber. This does not authorize a transfer or grant access to your funds.";
export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export type AuthEnv = { Variables: { walletAddress: string } };

export function createAuthRoute() {
  const route = new Hono();
  route.use("*", async (c, next) => { c.header("Cache-Control", "no-store"); await next(); });
  route.post("/auth/challenge", async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!isAddress(body?.walletAddress ?? "")) return c.json({ error: "Invalid wallet address" }, 400);
    const walletAddress = getAddress(body.walletAddress);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + NONCE_TTL_MS);
    const origin = new URL((process.env.FRONTEND_ORIGINS || "http://localhost:3000").split(",")[0].trim());
    const nonce = randomBytes(16).toString("hex");
    const chainId = Number(process.env.CHAIN_ID ?? 97);
    const message = createSiweMessage({ address: walletAddress, domain: origin.host, uri: origin.origin,
      version: "1", chainId, nonce, issuedAt: now, expirationTime: expiresAt, statement: AUTH_STATEMENT });
    // Expired records never authenticate; cleanup keeps storage bounded over time.
    await getPool().query("DELETE FROM auth_challenges WHERE expires_at <= now()");
    await getPool().query("DELETE FROM auth_sessions WHERE expires_at <= now()");
    const recent = await getPool().query("SELECT count(*)::int AS count FROM auth_challenges WHERE wallet_address = $1", [walletAddress]);
    if (recent.rows[0].count >= 10) return c.json({ error: "Too many sign-in requests. Try again in five minutes." }, 429);
    await getPool().query("INSERT INTO auth_challenges (nonce, wallet_address, message, expires_at) VALUES ($1,$2,$3,$4)",
      [nonce, walletAddress, message, expiresAt]);
    return c.json({ nonce, walletAddress, domain: origin.host, uri: origin.origin, chainId,
      issuedAt: now.toISOString(), expiresAt: expiresAt.toISOString() });
  });
  route.post("/auth/verify", async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!/^[a-f0-9]{32}$/.test(body?.nonce ?? "") || !/^0x[a-fA-F0-9]{130}$/.test(body?.signature ?? ""))
      return c.json({ error: "Invalid sign-in proof" }, 400);
    const found = await getPool().query("SELECT wallet_address, message FROM auth_challenges WHERE nonce = $1 AND expires_at > now()", [body.nonce]);
    const challenge = found.rows[0];
    if (!challenge || !await verifyMessage({ address: challenge.wallet_address, message: challenge.message, signature: body.signature as Hex }).catch(() => false))
      return c.json({ error: "Invalid or expired sign-in proof" }, 401);
    // Atomic consume prevents concurrent replay across Vercel instances.
    const consumed = await getPool().query("DELETE FROM auth_challenges WHERE nonce = $1 AND expires_at > now() RETURNING nonce", [body.nonce]);
    if (!consumed.rowCount) return c.json({ error: "Sign-in proof already used or expired" }, 401);
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await getPool().query("INSERT INTO auth_sessions (token_hash, wallet_address, expires_at) VALUES ($1,$2,$3)",
      [tokenHash(token), challenge.wallet_address, expiresAt]);
    return c.json({ token, walletAddress: challenge.wallet_address, expiresAt: expiresAt.toISOString() });
  });
  route.post("/auth/logout", requireWallet, async (c) => {
    await getPool().query("DELETE FROM auth_sessions WHERE token_hash = $1", [tokenHash(c.req.header("Authorization")!.slice(7))]);
    return c.json({ status: "signed_out" });
  });
  return route;
}

async function authenticate(c: Context<AuthEnv>) {
  c.header("Cache-Control", "no-store");
  const authorization = c.req.header("Authorization") ?? "";
  if (!/^Bearer [a-f0-9]{64}$/.test(authorization)) return c.json({ error: "Wallet sign-in required" }, 401);
  const result = await getPool().query("SELECT wallet_address FROM auth_sessions WHERE token_hash = $1 AND expires_at > now()", [tokenHash(authorization.slice(7))]);
  if (!result.rows[0]) return c.json({ error: "Wallet session expired. Sign in again." }, 401);
  c.set("walletAddress", result.rows[0].wallet_address);
}

export const requireWallet: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const error = await authenticate(c);
  if (error) return error;
  await next();
};

export const requireUser: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const error = await authenticate(c);
  if (error) return error;
  const id = c.req.param("id");
  if (!/^[a-fA-F0-9]{8}(-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}$/.test(id ?? "")) return c.json({ error: "Invalid user ID" }, 400);
  const user = await getPool().query("SELECT wallet_address FROM users WHERE id = $1", [id]);
  if (!user.rows[0]) return c.json({ error: "user not found" }, 404);
  if (user.rows[0].wallet_address !== c.get("walletAddress")) return c.json({ error: "This account belongs to another wallet" }, 403);
  await next();
};
