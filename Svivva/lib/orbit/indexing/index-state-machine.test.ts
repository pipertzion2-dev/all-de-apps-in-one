import { describe, expect, it } from "vitest";
import {
  canTransition,
  computeNextCheckAt,
  statusAfterProbe,
  statusAfterSubmit,
  aggregateUrlStatus,
} from "./index-state-machine";
import { resolveIndexUrls } from "./url-resolver";

describe("index state machine", () => {
  it("transitions created → discoverable when indexable", () => {
    expect(statusAfterProbe("created", { reachable: true, indexable: true })).toBe("discoverable");
  });

  it("transitions created → failed when unreachable", () => {
    expect(statusAfterProbe("created", { reachable: false, indexable: false })).toBe("failed");
  });

  it("transitions submitted → crawl_detected when indexable", () => {
    expect(statusAfterProbe("submitted", { reachable: true, indexable: true })).toBe(
      "crawl_detected",
    );
  });

  it("transitions submitted → indexed after crawl_detected probe", () => {
    expect(statusAfterProbe("crawl_detected", { reachable: true, indexable: true })).toBe(
      "indexed",
    );
  });

  it("statusAfterSubmit reflects provider outcome", () => {
    expect(statusAfterSubmit(true)).toBe("submitted");
    expect(statusAfterSubmit(false)).toBe("failed");
  });

  it("computeNextCheckAt is in the future", () => {
    const next = computeNextCheckAt("submitted");
    expect(next.getTime()).toBeGreaterThan(Date.now());
  });

  it("canTransition allows discoverable → submitted", () => {
    expect(canTransition("discoverable", "submitted")).toBe(true);
    expect(canTransition("indexed", "created")).toBe(false);
  });

  it("aggregateUrlStatus picks best status", () => {
    expect(aggregateUrlStatus(["submitted", "indexed", "discoverable"])).toBe("indexed");
    expect(aggregateUrlStatus(["failed", "failed"])).toBe("failed");
  });
});

describe("resolveIndexUrls", () => {
  it("resolves entity URLs and normalizes relative paths", () => {
    const urls = resolveIndexUrls(
      {
        entities: [
          { id: "p1", entityType: "page", url: "/about" },
          { id: "k1", entityType: "keyword", url: "https://example.com/kw" },
        ],
      },
      "https://example.com",
    );
    expect(urls).toContain("https://example.com/about");
    expect(urls).not.toContain("https://example.com/kw");
  });

  it("filters by targetEntityIds", () => {
    const urls = resolveIndexUrls(
      {
        entities: [
          { id: "p1", entityType: "page", url: "https://example.com/a" },
          { id: "p2", entityType: "page", url: "https://example.com/b" },
        ],
        targetEntityIds: ["p2"],
      },
      "https://example.com",
    );
    expect(urls).toEqual(["https://example.com/b"]);
  });

  it("includes explicit and content asset URLs", () => {
    const urls = resolveIndexUrls(
      {
        entities: [],
        explicitUrls: ["https://example.com/launch"],
        contentAssetUrls: ["/blog/post"],
      },
      "https://example.com",
    );
    expect(urls).toContain("https://example.com/launch");
    expect(urls).toContain("https://example.com/blog/post");
  });
});
