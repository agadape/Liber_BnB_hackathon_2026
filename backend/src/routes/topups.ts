// backend/src/routes/topups.ts
import { Hono } from "hono";
import { getAddress, parseUnits, type Hash } from "viem";
import { getPool } from "../db/pool.js";
import { requireUser } from "../auth/auth.js";
import { verifyTopup as defaultVerifyTopup, InvalidTopupError } from "../chain/topup.js";

export function createTopupsRoute(verifyTopup = defaultVerifyTopup) {
  const route = new Hono();
  route.post("/users/:id/topups", requireUser, async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!/^0x[a-fA-F0-9]{64}$/.test(body?.txHash ?? "") || typeof body?.amountUsdc !== "string" ||
        !/^\d+(\.\d{1,18})?$/.test(body.amountUsdc) || parseUnits(body.amountUsdc, 18) <= 0n)
      return c.json({ error: "Invalid transaction hash or token amount" }, 400);
    const txHash = body.txHash.toLowerCase() as Hash;
    const userId = c.req.param("id");
    const { rows } = await getPool().query("SELECT wallet_address, kolo_address FROM users WHERE id = $1", [userId]);
    const user = rows[0];
    if (!user.kolo_address) return c.json({ error: "Save a destination before logging a transfer" }, 400);
    let verified;
    try {
      verified = await verifyTopup({ txHash, sender: getAddress(user.wallet_address), destination: getAddress(user.kolo_address) });
      if (parseUnits(verified.amountUsdc, 18) !== parseUnits(body.amountUsdc, 18))
        return c.json({ error: "Amount does not match the confirmed token transfer" }, 400);
    } catch (error) {
      if (error instanceof InvalidTopupError) return c.json({ error: error.message }, 400);
      return c.json({ error: "Transaction is not confirmed or cannot be verified yet. Retry with the same hash." }, 409);
    }
    // The partial unique index also prevents concurrent receipt replay.
    const inserted = await getPool().query(
      `INSERT INTO kolo_topups (user_id, amount_usdc, tx_hash, verified, chain_id, token_address, destination_address)
       VALUES ($1,$2,$3,true,$4,$5,$6) ON CONFLICT (chain_id, tx_hash) WHERE verified DO NOTHING RETURNING id`,
      [userId, verified.amountUsdc, txHash, verified.chainId, verified.tokenAddress, user.kolo_address]);
    if (!inserted.rows[0]) {
      // A lost response can safely be retried without creating a second history row.
      const existing = await getPool().query(
        "SELECT id FROM kolo_topups WHERE chain_id=$1 AND tx_hash=$2 AND verified AND user_id=$3",
        [verified.chainId, txHash, userId]);
      if (existing.rows[0]) return c.json({ id: existing.rows[0].id, verified: true }, 200);
      return c.json({ error: "Transaction already recorded" }, 409);
    }
    return c.json({ id: inserted.rows[0].id, verified: true }, 201);
  });
  return route;
}
export const topupsRoute = createTopupsRoute();
