// backend/src/routes/users.ts
import { Hono } from "hono";
import { getAddress, isAddress } from "viem";
import { getPool } from "../db/pool.js";
import { getNativeBalance as defaultGetNativeBalance, isActivated } from "../chain/account.js";
import { requireWallet, requireUser, type AuthEnv } from "../auth/auth.js";

export interface UsersRouteDeps {
  getNativeBalance: typeof defaultGetNativeBalance;
}

const defaultDeps: UsersRouteDeps = {
  getNativeBalance: defaultGetNativeBalance,
};

export function createUsersRoute(deps: Partial<UsersRouteDeps> = {}) {
  const { getNativeBalance } = { ...defaultDeps, ...deps };
  const usersRoute = new Hono<AuthEnv>();

  usersRoute.post("/users", requireWallet, async (c) => {
    const body = await c.req.json<{ walletAddress: string }>();
    if (!isAddress(body.walletAddress ?? "")) {
      return c.json({ error: "walletAddress must be a valid EVM address" }, 400);
    }
    const walletAddress = getAddress(body.walletAddress);
    if (walletAddress !== c.get("walletAddress")) return c.json({ error: "Wallet ownership required" }, 403);

    try {
      const existing = await getPool().query(`SELECT id FROM users WHERE wallet_address = $1`, [walletAddress]);
      if (existing.rows[0]) {
        return c.json({ userId: existing.rows[0].id }, 200);
      }

      // The user needs a little BNB to pay gas for their own USDC transfers.
      const nativeBalance = await getNativeBalance(walletAddress);
      if (!isActivated(nativeBalance)) {
        return c.json({ status: "awaiting_funding" }, 202);
      }

      const { rows } = await getPool().query(`INSERT INTO users (wallet_address) VALUES ($1) RETURNING id`, [
        walletAddress,
      ]);

      return c.json({ userId: rows[0].id }, 201);
    } catch (err) {
      console.error("[users] " + (err as Error).message);
      return c.json({ error: (err as Error).message }, 502);
    }
  });

  usersRoute.post("/users/:id/kolo-address", requireUser, async (c) => {
    const { koloAddress } = await c.req.json<{ koloAddress: string }>();
    if (!isAddress(koloAddress ?? "")) {
      return c.json({ error: "koloAddress must be a valid EVM (BNB Chain) address" }, 400);
    }
    const normalized = getAddress(koloAddress);

    const { rows } = await getPool().query(`UPDATE users SET kolo_address = $2 WHERE id = $1 RETURNING id`, [
      c.req.param("id"),
      normalized,
    ]);
    if (!rows[0]) return c.json({ error: "user not found" }, 404);

    return c.json({ koloAddress: normalized });
  });

  usersRoute.get("/users/by-address/:walletAddress", requireWallet, async (c) => {
    const raw = c.req.param("walletAddress");
    if (!isAddress(raw)) {
      return c.json({ error: "walletAddress must be a valid EVM address" }, 400);
    }
    if (getAddress(raw) !== c.get("walletAddress")) return c.json({ error: "Wallet ownership required" }, 403);

    const { rows } = await getPool().query(`SELECT id, kolo_address FROM users WHERE wallet_address = $1`, [
      getAddress(raw),
    ]);
    if (!rows[0]) return c.json({ error: "user not found" }, 404);

    return c.json({ userId: rows[0].id, koloAddress: rows[0].kolo_address });
  });

  return usersRoute;
}

export const usersRoute = createUsersRoute();
