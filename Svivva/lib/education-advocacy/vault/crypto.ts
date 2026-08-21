/**
 * Key architecture: Encryption Key ≠ Blockchain Wallet ≠ User Identity.
 * Never expose raw private keys on ordinary screens.
 * Never store unencrypted recovery secrets in logs, analytics, emails, notifications, or chain metadata.
 */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";

export const VAULT_CRYPTO_ALG = "aes-256-gcm" as const;

export type EncryptedBlob = {
  alg: typeof VAULT_CRYPTO_ALG;
  iv: string; // base64
  tag: string; // base64
  ciphertext: string; // base64
  kdf: "scrypt";
  salt: string; // base64
};

export type VaultKeyMaterial = {
  /** Raw 32-byte encryption key — keep in memory only; never log. */
  encryptionKey: Buffer;
  /** Fingerprint for UI (not secret). */
  keyFingerprint: string;
};

export function deriveEncryptionKey(
  passphrase: string,
  salt?: Buffer,
): {
  key: Buffer;
  salt: Buffer;
  fingerprint: string;
} {
  const s = salt || randomBytes(16);
  const key = scryptSync(passphrase, s, 32, { N: 16384, r: 8, p: 1 });
  const fingerprint = createHash("sha256").update(key).digest("hex").slice(0, 16);
  return { key, salt: s, fingerprint };
}

export function encryptUtf8(plaintext: string, passphrase: string): EncryptedBlob {
  const { key, salt } = deriveEncryptionKey(passphrase);
  const iv = randomBytes(12);
  const cipher = createCipheriv(VAULT_CRYPTO_ALG, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    alg: VAULT_CRYPTO_ALG,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: enc.toString("base64"),
    kdf: "scrypt",
    salt: salt.toString("base64"),
  };
}

export function decryptUtf8(blob: EncryptedBlob, passphrase: string): string {
  const salt = Buffer.from(blob.salt, "base64");
  const { key } = deriveEncryptionKey(passphrase, salt);
  const decipher = createDecipheriv(VAULT_CRYPTO_ALG, key, Buffer.from(blob.iv, "base64"));
  decipher.setAuthTag(Buffer.from(blob.tag, "base64"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(blob.ciphertext, "base64")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

export function sha256Hex(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

export function hmacSha256Hex(key: Buffer | string, data: string): string {
  return createHmac("sha256", key).update(data).digest("hex");
}

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => canonicalize(v)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(",")}}`;
}

export function digestCanonical(value: unknown): string {
  return sha256Hex(canonicalize(value));
}

export function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/** Recovery path stub — wraps a key with a secondary passphrase without logging secrets. */
export function wrapKeyForRecovery(
  encryptionKey: Buffer,
  recoveryPassphrase: string,
): EncryptedBlob {
  return encryptUtf8(encryptionKey.toString("base64"), recoveryPassphrase);
}

export function unwrapKeyFromRecovery(blob: EncryptedBlob, recoveryPassphrase: string): Buffer {
  const b64 = decryptUtf8(blob, recoveryPassphrase);
  return Buffer.from(b64, "base64");
}
