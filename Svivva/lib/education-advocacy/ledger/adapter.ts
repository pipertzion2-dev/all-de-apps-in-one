import type { LedgerAdapter } from "../adapters/interfaces";
export type { LedgerAdapter } from "../adapters/interfaces";
export {
  InternalAppendOnlyLedger,
  DigestOnlyPublicLedgerStub,
  LedgerAdapterRegistry,
  sanitizeMetadata,
} from "./internal";

/** Factory helpers for future Bitcoin / Ethereum / QTSP / transparency-log adapters. */
export type LedgerAdapterKind =
  | "internal"
  | "bitcoin_anchor"
  | "evm_compatible"
  | "permissioned_institutional"
  | "third_party_timestamp"
  | "transparency_log";

export function describeLedgerKinds(): Array<{ kind: LedgerAdapterKind; note: string }> {
  return [
    { kind: "internal", note: "Default append-only digest log — no cryptocurrency required." },
    { kind: "bitcoin_anchor", note: "Optional future adapter — digest only." },
    { kind: "evm_compatible", note: "Optional future adapter — digest only." },
    { kind: "permissioned_institutional", note: "Optional school/partner ledger." },
    { kind: "third_party_timestamp", note: "Optional QTSP / TSA style timestamping." },
    { kind: "transparency_log", note: "Optional transparency log commitment." },
  ];
}

export async function withOptionalLedger<T>(
  adapter: LedgerAdapter | undefined,
  fn: (a: LedgerAdapter) => Promise<T>,
  fallback: T,
): Promise<T> {
  if (!adapter) return fallback;
  return fn(adapter);
}
