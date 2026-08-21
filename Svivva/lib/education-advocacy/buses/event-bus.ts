/**
 * Lightweight typed event bus. Modules publish/subscribe to shared schemas
 * instead of hard-coding dependencies on one another.
 */

export type BusName =
  | "identity"
  | "education"
  | "advocacy"
  | "legal"
  | "safety"
  | "evidence"
  | "resource"
  | "action";

export type BusEvent<T = unknown> = {
  id: string;
  bus: BusName;
  type: string;
  payload: T;
  at: string;
  actorType?: "user" | "system" | "ai" | "admin" | "partner";
  schemaVersion: string;
};

type Handler<T = unknown> = (event: BusEvent<T>) => void | Promise<void>;

export class EducationAdvocacyEventBus {
  private handlers = new Map<string, Set<Handler>>();
  private history: BusEvent[] = [];
  private readonly maxHistory: number;

  constructor(maxHistory = 500) {
    this.maxHistory = maxHistory;
  }

  subscribe<T = unknown>(bus: BusName, type: string | "*", handler: Handler<T>): () => void {
    const key = `${bus}:${type}`;
    if (!this.handlers.has(key)) this.handlers.set(key, new Set());
    this.handlers.get(key)!.add(handler as Handler);
    return () => this.handlers.get(key)?.delete(handler as Handler);
  }

  async publish<T>(
    event: Omit<BusEvent<T>, "id" | "at"> & { id?: string; at?: string },
  ): Promise<BusEvent<T>> {
    const full: BusEvent<T> = {
      ...event,
      id: event.id || `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      at: event.at || new Date().toISOString(),
    };
    this.history.push(full as BusEvent);
    if (this.history.length > this.maxHistory) {
      this.history.splice(0, this.history.length - this.maxHistory);
    }
    const keys = [`${full.bus}:${full.type}`, `${full.bus}:*`];
    for (const key of keys) {
      const set = this.handlers.get(key);
      if (!set) continue;
      for (const h of set) {
        await h(full as BusEvent);
      }
    }
    return full;
  }

  getHistory(bus?: BusName, limit = 50): BusEvent[] {
    const filtered = bus ? this.history.filter((e) => e.bus === bus) : this.history;
    return filtered.slice(-limit);
  }

  clear(): void {
    this.history = [];
  }
}

/** Process-local default bus — modules should prefer injecting their own instance in tests. */
export const defaultAdvocacyBus = new EducationAdvocacyEventBus();
