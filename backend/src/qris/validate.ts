import { calculateCRC16 } from "./crc16.js";
import { parseQRIS } from "./parser.js";

export function inspectQris(payload: string, staticAmount?: string) {
  if (typeof payload !== "string" || payload.length > 4096 || !/^[\x20-\x7e]+$/.test(payload)) throw new Error("QR payload must contain 1–4096 printable ASCII characters.");
  const tags = new Map<string,string>();
  let pos = 0;
  while (pos < payload.length) {
    const header = payload.slice(pos,pos+4);
    if (!/^\d{4}$/.test(header)) throw new Error("QR contains an invalid or incomplete field.");
    const tag = header.slice(0,2), length = Number(header.slice(2));
    if (!length || pos + 4 + length > payload.length || tags.has(tag)) throw new Error("QR contains duplicate or truncated fields.");
    const value = payload.slice(pos+4,pos+4+length);
    tags.set(tag,value); pos += 4 + length;
    if (tag === "63" && (length !== 4 || pos !== payload.length)) throw new Error("Checksum must be the final field.");
  }
  if (tags.get("00") !== "01" || !["11","12"].includes(tags.get("01") ?? "") || tags.get("53") !== "360" || tags.get("58") !== "ID" || !tags.get("59")) throw new Error("Expected an Indonesian IDR merchant QR with a supported format.");
  if (!/^[A-Fa-f0-9]{4}$/.test(tags.get("63") ?? "") || calculateCRC16(payload.slice(0,-4)) !== tags.get("63")!.toUpperCase()) throw new Error("QR checksum does not match. Scan the original code again.");
  const parsed = parseQRIS(payload);
  const amount = parsed.amount ?? staticAmount;
  if (amount !== undefined && (!/^\d{1,12}(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0)) throw new Error("Enter a positive IDR amount with up to two decimal places.");
  if (parsed.method === "dynamic" && !parsed.amount) throw new Error("Dynamic QR is missing its amount.");
  return { merchantName: parsed.merchantName, merchantCity: parsed.merchantCity, method: parsed.method,
    amountIdr: amount ?? null, currency: "IDR", checksumValid: true, merchantIdentityVerified: false, qrisSettlementSupported: false };
}
