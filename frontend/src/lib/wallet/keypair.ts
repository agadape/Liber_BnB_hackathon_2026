import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

/** Generates an EVM keypair client-side. `publicKey` is the 0x address, `secretKey` the 0x private key. */
export function generateKeypair(): { publicKey: string; secretKey: string } {
  const secretKey = generatePrivateKey();
  return { publicKey: privateKeyToAccount(secretKey).address, secretKey };
}

/** Derives the address for a private key; throws if the key is malformed. */
export function addressFromSecret(secretKey: string): string {
  const normalized = (secretKey.startsWith("0x") ? secretKey : `0x${secretKey}`) as `0x${string}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) throw new Error("invalid private key");
  return privateKeyToAccount(normalized).address;
}
