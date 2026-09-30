// backend/src/routes/balance.ts
import { Hono } from "hono";
import { getPool } from "../db/pool.js";
import { getRateIdrPerUsdc as defaultGetRateIdrPerUsdc } from "../quote/quote.js";
import { loadUsdcBalance } from "../chain/account.js";
import { requireUser } from "../auth/auth.js";

export interface BalanceRouteDeps {
  loadUsdcBalance: typeof loadUsdcBalance;
  getRateIdrPerUsdc: typeof defaultGetRateIdrPerUsdc;
}

const defaultDeps: BalanceRouteDeps = {
  loadUsdcBalance,
  getRateIdrPerUsdc: defaultGetRateIdrPerUsdc,
};

export function createBalanceRoute(deps: Partial<BalanceRouteDeps> = {}): Hono {
  const { loadUsdcBalance, getRateIdrPerUsdc } = { ...defaultDeps, ...deps };
  const balanceRoute = new Hono();

  balanceRoute.get("/users/:id/balance", requireUser, async (c) => {
    const { rows } = await getPool().query(`SELECT wallet_address FROM users WHERE id = $1`, [c.req.param("id")]);
    const user = rows[0];
    if (!user) return c.json({ error: "user not found" }, 404);

    const [usdcBalance, rate] = await Promise.all([
      loadUsdcBalance(user.wallet_address),
      getRateIdrPerUsdc(),
    ]);

    return c.json({
      usdcBalance,
      idrEstimate: Math.round(Number(usdcBalance) * rate).toString(),
    });
  });

  return balanceRoute;
}

export const balanceRoute = createBalanceRoute();
