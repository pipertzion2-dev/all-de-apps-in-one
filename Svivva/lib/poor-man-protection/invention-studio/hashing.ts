/** Browser + Node compatible SHA-256 helpers for Invention Protection Studio. */

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Bytes(buffer: BufferSource): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return toHex(digest);
}

export async function sha256Text(text: string): Promise<string> {
  return sha256Bytes(new TextEncoder().encode(text));
}

export async function sha256File(file: Blob): Promise<string> {
  return sha256Bytes(await file.arrayBuffer());
}

/** Tamper-evident chain: hash(prevHash + canonical JSON of event). */
export async function chainEventHash(
  prevHash: string | undefined,
  payload: Record<string, unknown>,
): Promise<string> {
  const canonical = JSON.stringify({
    prev: prevHash || "genesis",
    ...payload,
  });
  return sha256Text(canonical);
}

export function shortHash(hash: string, n = 12): string {
  return hash.slice(0, n);
}
