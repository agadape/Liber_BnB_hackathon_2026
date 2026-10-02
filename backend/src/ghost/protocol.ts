// Generated from protocol/ghost-v1.json; run scripts/generate-ghost-protocol.mjs.
export const GHOST = {
  "productName": "liber:Ghost Protocol",
  "version": 1,
  "chainId": 97,
  "domainName": "LiberGhost",
  "domainVersion": "1",
  "primaryType": "GhostVoucher",
  "tokenDecimals": 18,
  "minValiditySeconds": 300,
  "maxValiditySeconds": 604800,
  "maxAmountRaw": "1000000000000000000000",
  "confirmationsRequired": 12,
  "headMaxAgeSeconds": 15,
  "redeemBufferSeconds": 60,
  "qrPrefix": "liber-ghost:v1:",
  "packetBytes": 416,
  "maxScanCharacters": 1024,
  "fields": [
    {
      "name": "owner",
      "type": "address"
    },
    {
      "name": "merchant",
      "type": "address"
    },
    {
      "name": "amount",
      "type": "uint256"
    },
    {
      "name": "validBefore",
      "type": "uint64"
    },
    {
      "name": "salt",
      "type": "bytes32"
    }
  ]
} as const;
export const ghostTypes = { GhostVoucher: GHOST.fields } as const;
