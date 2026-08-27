import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

/**
 * Encrypt Orbit SEO OAuth/API secrets at rest.
 * Key: ORBIT_SEO_SECRETS_KEY (32-byte hex or any string hashed to 32 bytes).
 * Never expose ciphertext decryption results to the browser.
 */
function keyBytes(): Buffer {
  const raw = process.env.ORBIT_SEO_SECRETS_KEY?.trim() || process.env.ENCRYPTION_KEY?.trim() || "";
  if (!raw) {
    // Dev fallback — still encrypts; production must set ORBIT_SEO_SECRETS_KEY
    return createHash("sha256").update("orbit-seo-dev-insecure-key").digest();
  }
  if (/^[a-f0-9]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBytes(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${enc.toString("base64url")}`;
}

export function decryptSecret(payload: string): string {
  const [v, ivB64, tagB64, dataB64] = payload.split(":");
  if (v !== "v1" || !ivB64 || !tagB64 || !dataB64) throw new Error("Invalid secret payload");
  const decipher = createDecipheriv("aes-256-gcm", keyBytes(), Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
