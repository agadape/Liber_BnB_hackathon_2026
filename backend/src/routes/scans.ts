// backend/src/routes/scans.ts
import { Hono } from "hono";
import { getPool } from "../db/pool.js";
import { requireUser } from "../auth/auth.js";

export const scansRoute = new Hono();

scansRoute.post("/users/:id/scans", requireUser, async (c) => {
  const userId = c.req.param("id");
  const { merchantName, merchantCity, amountIdr, amountUsdc } = await c.req.json<{
    merchantName: string;
    merchantCity: string;
    amountIdr: string;
    amountUsdc: string;
  }>();
  if (typeof merchantName !== "string" || !merchantName.trim() || merchantName.length > 200 ||
      typeof merchantCity !== "string" || merchantCity.length > 200 ||
      !/^\d+(\.\d{1,2})?$/.test(amountIdr ?? "") || Number(amountIdr) <= 0 ||
      !/^\d+(\.\d{1,18})?$/.test(amountUsdc ?? "") || Number(amountUsdc) <= 0)
    return c.json({ error: "Invalid scan details" }, 400);

  const { rows: userRows } = await getPool().query(`SELECT id FROM users WHERE id = $1`, [userId]);
  if (!userRows[0]) return c.json({ error: "user not found" }, 404);

  const { rows } = await getPool().query(
    `INSERT INTO qris_scans (user_id, merchant_name, merchant_city, amount_idr, amount_usdc)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [userId, merchantName, merchantCity, amountIdr, amountUsdc]
  );

  return c.json({ id: rows[0].id }, 201);
});
