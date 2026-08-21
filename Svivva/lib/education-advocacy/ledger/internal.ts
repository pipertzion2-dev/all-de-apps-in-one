import { createHash, randomUUID } from "crypto";
import type {
  LedgerAdapter,
  LedgerAnchorRequest,
  LedgerAnchorResult,
  LedgerReceipt,
  LedgerVerifyResult,
} from "../adapters/interfaces";

/**
 * Internal append-only ledger — default verification path.
 * Never stores student names, school names, document contents, or crisis text.
 * Only cryptographic digests and opaque proof IDs.
 */
export class InternalAppendOnlyLedger implements LedgerAdapter {
  id = "internal-append-only";
  private rows: Array<{
    proofId: string;
    digestHex: string;
    createdAt: string;
    tx: string;
    metadata?: Record<string, string>;
  }> = [];

  async anchorProof(req: LedgerAnchorRequest): Promise<LedgerAnchorResult> {
    // Strip any accidental sensitive keys from metadata
    const metadata = sanitizeMetadata(req.metadata);
    const tx = `int_${createHash("sha256")
      .update(`${req.proofId}:${req.digestHex}:${req.createdAt}`)
      .digest("hex")
      .slice(0, 24)}`;
    this.rows.push({
      proofId: req.proofId,
      digestHex: req.digestHex.toLowerCase(),
      createdAt: req.createdAt,
      tx,
      metadata,
    });
    return {
      anchored: true,
      network: "zzai-internal-audit-log",
      transactionRef: tx,
      anchoredAt: new Date().toISOString(),
      status: "confirmed",
      note: "Digest-only internal anchor. Not a public blockchain; not a court judgment.",
    };
  }

  async verifyProof(digestHex: string, transactionRef?: string): Promise<LedgerVerifyResult> {
    const dig = digestHex.toLowerCase();
    const row = this.rows.find(
      (r) => r.digestHex === dig && (!transactionRef || r.tx === transactionRef),
    );
    if (!row) {
      return { found: false, matches: false, status: "not_found" };
    }
    return {
      found: true,
      matches: true,
      network: "zzai-internal-audit-log",
      transactionRef: row.tx,
      timestamp: row.createdAt,
      status: "confirmed",
    };
  }

  async getReceipt(proofId: string): Promise<LedgerReceipt | null> {
    const row = this.rows.find((r) => r.proofId === proofId);
    if (!row) return null;
    return {
      proofId: row.proofId,
      digestHex: row.digestHex,
      network: "zzai-internal-audit-log",
      transactionRef: row.tx,
      timestamp: row.createdAt,
      status: "confirmed",
    };
  }

  async getTimestamp(proofId: string): Promise<string | null> {
    return (await this.getReceipt(proofId))?.timestamp || null;
  }

  async getNetworkStatus() {
    return { online: true, network: "zzai-internal-audit-log", detail: "local append-only" };
  }
}

/** Optional stub for future public anchoring — digests only. */
export class DigestOnlyPublicLedgerStub implements LedgerAdapter {
  id = "public-digest-stub";
  async anchorProof(req: LedgerAnchorRequest): Promise<LedgerAnchorResult> {
    return {
      anchored: false,
      network: "unconfigured-public-adapter",
      status: "skipped",
      note: `Public anchoring adapter not configured. Digest ${req.digestHex.slice(0, 12)}… was not published.`,
    };
  }
  async verifyProof(): Promise<LedgerVerifyResult> {
    return { found: false, matches: false, status: "adapter_unconfigured" };
  }
  async getReceipt(): Promise<LedgerReceipt | null> {
    return null;
  }
  async getTimestamp(): Promise<string | null> {
    return null;
  }
  async getNetworkStatus() {
    return { online: false, network: "unconfigured-public-adapter" };
  }
}

const FORBIDDEN_META = [
  "name",
  "student",
  "address",
  "school",
  "medical",
  "allegation",
  "crisis",
  "photo",
  "document",
  "content",
  "email",
  "phone",
];

export function sanitizeMetadata(
  meta?: Record<string, string>,
): Record<string, string> | undefined {
  if (!meta) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(meta)) {
    const key = k.toLowerCase();
    if (FORBIDDEN_META.some((f) => key.includes(f))) continue;
    if (typeof v === "string" && v.length <= 120) out[k] = v;
  }
  return out;
}

export class LedgerAdapterRegistry {
  private adapters = new Map<string, LedgerAdapter>();
  private activeId: string;

  constructor(defaultAdapter: LedgerAdapter) {
    this.adapters.set(defaultAdapter.id, defaultAdapter);
    this.activeId = defaultAdapter.id;
  }

  register(adapter: LedgerAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  setActive(id: string): void {
    if (!this.adapters.has(id)) throw new Error(`Unknown ledger adapter: ${id}`);
    this.activeId = id;
  }

  active(): LedgerAdapter {
    return this.adapters.get(this.activeId)!;
  }

  list(): string[] {
    return [...this.adapters.keys()];
  }
}

export function createOpaqueProofId(): string {
  return `epr_${randomUUID().replace(/-/g, "").slice(0, 14)}`;
}
