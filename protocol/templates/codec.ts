// Canonical source. Generated into both apps by generate-ghost-protocol.mjs.
import { decodeAbiParameters, encodeAbiParameters, getAddress, hashTypedData, hexToBytes, bytesToHex, isAddress, recoverTypedDataAddress, parseUnits, type Address, type Hash, type Hex } from "viem";
import { GHOST, ghostTypes } from "./protocol";

export interface GhostVoucher { owner: Address; merchant: Address; amount: bigint; validBefore: bigint; salt: Hash }
export interface GhostPacket { vault: Address; voucher: GhostVoucher; signature: Hex; id: Hash }
export const voucherTuple = { type: "tuple", components: GHOST.fields } as const;
export const packetAbi = [{type:"uint8"},{type:"uint256"},{type:"address"},voucherTuple,{type:"bytes"}] as const;
export const hashPattern = /^0x[0-9a-fA-F]{64}$/;
const halfOrder = 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0n;

export function ghostDomain(vault: Address) {
  return { name: GHOST.domainName, version: GHOST.domainVersion, chainId: GHOST.chainId, verifyingContract: vault } as const;
}
export function voucherTypedData(vault: Address, voucher: GhostVoucher) {
  return { domain: ghostDomain(vault), types: ghostTypes, primaryType: GHOST.primaryType, message: voucher } as const;
}
export function voucherId(vault: Address, voucher: GhostVoucher): Hash { return hashTypedData(voucherTypedData(vault,voucher)); }
export function validateVoucher(voucher: GhostVoucher, vault: Address): void {
  if (!isAddress(vault) || /^0x0{40}$/i.test(vault)) throw Error("Unknown Ghost vault.");
  if (!isAddress(voucher.owner) || !isAddress(voucher.merchant) || /^0x0{40}$/i.test(voucher.owner) || /^0x0{40}$/i.test(voucher.merchant)) throw Error("Invalid voucher wallet.");
  if (getAddress(voucher.owner)===getAddress(voucher.merchant) || getAddress(voucher.merchant)===getAddress(vault)) throw Error("Choose a different merchant wallet.");
  if (typeof voucher.amount!=="bigint" || voucher.amount<=0n || voucher.amount>BigInt(GHOST.maxAmountRaw)) throw Error("Use a positive amount up to 1,000 MockUSDC.");
  if (typeof voucher.validBefore!=="bigint" || voucher.validBefore<=0n || voucher.validBefore>0xffffffffffffffffn) throw Error("Invalid voucher expiry.");
  if (!hashPattern.test(voucher.salt)) throw Error("Invalid voucher salt.");
}
export function normalizeSignature(raw: Hex): Hex {
  if (!/^0x[0-9a-fA-F]{130}$/.test(raw)) throw Error("This wallet did not return a supported EOA signature.");
  const bytes=hexToBytes(raw);
  if (bytes[64]===0 || bytes[64]===1) bytes[64]+=27;
  if (bytes[64]!==27 && bytes[64]!==28) throw Error("Invalid signature recovery byte.");
  const r=BigInt(bytesToHex(bytes.slice(0,32))), s=BigInt(bytesToHex(bytes.slice(32,64)));
  if(r===0n || s===0n || s>halfOrder) throw Error("Noncanonical voucher signature.");
  return bytesToHex(bytes);
}
export async function validateSignature(vault: Address, voucher: GhostVoucher, raw: Hex): Promise<Hex> {
  validateVoucher(voucher,vault);
  const signature=normalizeSignature(raw);
  const recovered=await recoverTypedDataAddress({...voucherTypedData(vault,voucher),signature});
  if(getAddress(recovered)!==getAddress(voucher.owner)) throw Error("Voucher authorization does not match its owner.");
  return signature;
}
function toBase64(bytes: Uint8Array): string {
  let binary=""; for(const byte of bytes) binary+=String.fromCharCode(byte);
  return btoa(binary).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");
}
function fromBase64(value: string): Uint8Array {
  if(!/^[A-Za-z0-9_-]+$/.test(value)) throw Error("Malformed Ghost code.");
  const binary=atob(value.replaceAll("-","+").replaceAll("_","/")+"=".repeat((4-value.length%4)%4));
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  if(toBase64(bytes)!==value) throw Error("Noncanonical Ghost encoding.");
  return bytes;
}
export function encodePacket(vault: Address, voucher: GhostVoucher, signature: Hex): string {
  validateVoucher(voucher,vault); signature=normalizeSignature(signature);
  const bytes=hexToBytes(encodeAbiParameters(packetAbi,[GHOST.version,BigInt(GHOST.chainId),vault,voucher,signature]));
  if(bytes.length!==GHOST.packetBytes) throw Error("Ghost packet layout changed.");
  return GHOST.qrPrefix+toBase64(bytes);
}
export async function decodePacket(input: string, expectedVault: Address): Promise<GhostPacket> {
  if(typeof input!=="string" || input.length>GHOST.maxScanCharacters || !input.startsWith(GHOST.qrPrefix) || input.trim()!==input || /[\x00-\x20\x7f]/.test(input)) throw Error("Scan a liber:Ghost Protocol voucher, not a QRIS or web link.");
  const bytes=fromBase64(input.slice(GHOST.qrPrefix.length));
  if(bytes.length!==GHOST.packetBytes) throw Error("Unsupported Ghost packet size.");
  const encoded=bytesToHex(bytes);
  const [version,chainId,vault,voucher,raw]=decodeAbiParameters(packetAbi,encoded);
  if(version!==1 || chainId!==97n || getAddress(vault)!==getAddress(expectedVault)) throw Error("Voucher belongs to another protocol, network, or vault.");
  if(encodeAbiParameters(packetAbi,[version,chainId,vault,voucher,raw]).toLowerCase()!==encoded.toLowerCase()) throw Error("Noncanonical Ghost packet.");
  const signature=await validateSignature(vault,voucher,raw);
  // QR encoding itself must already carry normalized, canonical signature bytes.
  if(signature.toLowerCase()!==raw.toLowerCase()) throw Error("Noncanonical Ghost signature encoding.");
  return {vault:getAddress(vault),voucher,signature,id:voucherId(vault,voucher)};
}
export function parseGhostAmount(input: string): bigint {
  if(!/^(0|[1-9]\d{0,3})(\.\d{1,18})?$/.test(input)) throw Error("Enter a decimal MockUSDC amount, without commas or exponent notation.");
  const amount=parseUnits(input,18);
  if(amount<=0n || amount>BigInt(GHOST.maxAmountRaw)) throw Error("Use a positive amount up to 1,000 MockUSDC.");
  return amount;
}
export function serializeVoucher(v: GhostVoucher) { return {owner:v.owner,merchant:v.merchant,amountRaw:v.amount.toString(),validBefore:v.validBefore.toString(),salt:v.salt}; }
export function deserializeVoucher(raw: unknown): GhostVoucher {
  if(!raw || typeof raw!=="object" || Array.isArray(raw)) throw Error("Malformed voucher fields.");
  const r=raw as Record<string,unknown>;
  if(Object.keys(r).sort().join(",")!=="amountRaw,merchant,owner,salt,validBefore" || typeof r.amountRaw!=="string" || !/^[1-9]\d{0,77}$/.test(r.amountRaw) || typeof r.validBefore!=="string" || !/^[1-9]\d{0,19}$/.test(r.validBefore) || typeof r.owner!=="string" || typeof r.merchant!=="string" || typeof r.salt!=="string" || !isAddress(r.owner) || !isAddress(r.merchant) || !hashPattern.test(r.salt)) throw Error("Malformed voucher fields.");
  return {owner:getAddress(r.owner),merchant:getAddress(r.merchant),amount:BigInt(r.amountRaw),validBefore:BigInt(r.validBefore),salt:r.salt as Hash};
}
