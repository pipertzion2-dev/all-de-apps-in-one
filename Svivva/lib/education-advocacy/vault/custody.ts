import { createHash, randomUUID } from "crypto";
import { canonicalize, sha256Hex } from "./crypto";

export type CustodyActorType = "user" | "system" | "ai" | "admin" | "recipient" | "service";

export type CustodyAction =
  | "created"
  | "hashed"
  | "sealed"
  | "versioned"
  | "shared"
  | "verified"
  | "new_version_created"
  | "exported"
  | "superseded";

export type CustodyEvent = {
  eventId: string;
  objectId: string;
  timestamp: string;
  actorType: CustodyActorType;
  action: CustodyAction;
  previousHash: string | null;
  currentHash: string;
  signature?: string;
  detail?: string;
};

/**
 * Append-only chain of custody.
 * Editing a sealed record must create a new version — never silently overwrite.
 */
export class ChainOfCustody {
  private events: CustodyEvent[] = [];

  getHistory(objectId?: string): CustodyEvent[] {
    return objectId ? this.events.filter((e) => e.objectId === objectId) : [...this.events];
  }

  append(input: {
    objectId: string;
    actorType: CustodyActorType;
    action: CustodyAction;
    contentHash: string;
    detail?: string;
    signingKey?: string;
  }): CustodyEvent {
    const previous = [...this.events].reverse().find((e) => e.objectId === input.objectId);
    const previousHash = previous?.currentHash ?? null;
    const timestamp = new Date().toISOString();
    const eventId = randomUUID();
    const payload = {
      eventId,
      objectId: input.objectId,
      timestamp,
      actorType: input.actorType,
      action: input.action,
      previousHash,
      contentHash: input.contentHash,
      detail: input.detail || null,
    };
    const currentHash = sha256Hex(canonicalize(payload));
    const signature = input.signingKey
      ? createHash("sha256").update(`${input.signingKey}:${currentHash}`).digest("hex")
      : undefined;
    const event: CustodyEvent = {
      eventId,
      objectId: input.objectId,
      timestamp,
      actorType: input.actorType,
      action: input.action,
      previousHash,
      currentHash,
      signature,
      detail: input.detail,
    };
    this.events.push(event);
    return event;
  }

  verifyChain(objectId: string): { ok: boolean; brokenAt?: string } {
    const rows = this.getHistory(objectId);
    let prev: string | null = null;
    for (const e of rows) {
      if (e.previousHash !== prev) {
        return { ok: false, brokenAt: e.eventId };
      }
      prev = e.currentHash;
    }
    return { ok: true };
  }
}
