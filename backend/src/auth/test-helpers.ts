import { randomBytes } from "node:crypto";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { isAddress, getAddress } from "viem";
import { getPool } from "../db/pool.js";
import { tokenHash } from "./auth.js";

export async function authHeaders(userId?: string, walletAddress?: string) {
  let address = walletAddress && isAddress(walletAddress) ? getAddress(walletAddress) : privateKeyToAccount(generatePrivateKey()).address;
  if (userId) {
    const user = await getPool().query("SELECT wallet_address FROM users WHERE id = $1", [userId]);
    if (user.rows[0]) address = user.rows[0].wallet_address;
  }
  const token = randomBytes(32).toString("hex");
  await getPool().query("INSERT INTO auth_sessions (token_hash, wallet_address, expires_at) VALUES ($1,$2,now() + interval '10 minutes')", [tokenHash(token), address]);
  return { Authorization: `Bearer ${token}` };
}
