import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ORBIT_FREE_STACK,
  ORBIT_FREE_STACK_SERVICES,
  ORBIT_PAID_SERVICES,
  isOrbitFreeTierService,
  orbitFreeStackServices,
  orbitServiceById,
} from "./orbit-services-catalog";
import { MARKETING_CREDENTIAL_FIELDS } from "./marketing-autopilot-types";
import { hasAutoPostCredentials, isCopyOnlyDistributionMode } from "./distribution-mode";
import { postizApiBase, publishPostizPost } from "./marketing-autopilot-publishers";

describe("Orbit $0 free stack", () => {
  it("resolves every free-stack step to a real catalog service", () => {
    const resolved = orbitFreeStackServices();
    expect(resolved).toHaveLength(ORBIT_FREE_STACK.length);
    for (const entry of resolved) {
      expect(entry.item.id).toBeTruthy();
    }
  });

  it("keeps the free stack genuinely free — no paid-only service sneaks in", () => {
    for (const { item } of orbitFreeStackServices()) {
      expect(isOrbitFreeTierService(item), `${item.id} is billed as ${item.billing}`).toBe(true);
    }
  });

  it("documents an exact free allowance for every free-stack step", () => {
    for (const { item } of orbitFreeStackServices()) {
      expect(item.freeTier, `${item.id} is missing a freeTier note`).toBeTruthy();
    }
  });

  it("covers indexing, AI, orchestration, social posting, email and analytics", () => {
    const ids = ORBIT_FREE_STACK.map((s) => s.id);
    expect(ids).toContain("gsc-oauth");
    expect(ids).toContain("indexnow");
    expect(ids).toContain("gemini");
    expect(ids).toContain("n8n");
    expect(ids).toContain("postiz");
    expect(ids).toContain("resend");
    expect(ids).toContain("clarity");
  });

  it("is ordered and starts with Google indexing", () => {
    const steps = ORBIT_FREE_STACK.map((s) => s.step);
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
    expect(ORBIT_FREE_STACK[0].id).toBe("gsc-oauth");
  });

  it("does not recommend Ayrshare as free — it has no free tier", () => {
    expect(ORBIT_FREE_STACK.map((s) => s.id)).not.toContain("ayrshare");
    const ayrshare = orbitServiceById("ayrshare");
    expect(ayrshare?.billing).toBe("paid");
    expect(ayrshare?.freeTier).toBeUndefined();
    // Guards against the stale "~$49/mo" label; entry price is $149/mo.
    expect(ayrshare?.priceLabel).toContain("149");
  });

  it("offers a free social auto-post route so posting is not paid-only", () => {
    const free = [...ORBIT_PAID_SERVICES, ...ORBIT_FREE_STACK_SERVICES].filter(
      (s) => s.category === "distribution" && isOrbitFreeTierService(s),
    );
    expect(free.length).toBeGreaterThan(0);
    expect(free.map((s) => s.id)).toContain("postiz");
  });
});

describe("Postiz free social publishing", () => {
  it("exposes a paste-key credential wired to the catalog", () => {
    const postiz = orbitServiceById("postiz");
    expect(postiz?.credentialKey).toBe("postizApiKey");
    const keys = MARKETING_CREDENTIAL_FIELDS.map((f) => f.key);
    expect(keys).toContain("postizApiKey");
    expect(keys).toContain("postizApiUrl");
  });

  it("treats the instance URL as non-secret and the key as secret", () => {
    const url = MARKETING_CREDENTIAL_FIELDS.find((f) => f.key === "postizApiUrl");
    const key = MARKETING_CREDENTIAL_FIELDS.find((f) => f.key === "postizApiKey");
    expect(url?.secret).toBeFalsy();
    expect(key?.secret).toBe(true);
  });

  it("derives the public API base for self-hosted and cloud instances", () => {
    expect(postizApiBase("https://postiz.example.com")).toBe(
      "https://postiz.example.com/api/public/v1",
    );
    expect(postizApiBase("https://postiz.example.com/")).toBe(
      "https://postiz.example.com/api/public/v1",
    );
    expect(postizApiBase("https://postiz.example.com/api")).toBe(
      "https://postiz.example.com/api/public/v1",
    );
    // Already-complete bases must not be doubled up.
    expect(postizApiBase("https://postiz.example.com/api/public/v1")).toBe(
      "https://postiz.example.com/api/public/v1",
    );
    expect(postizApiBase(undefined)).toBe("https://api.postiz.com/public/v1");
    expect(postizApiBase("   ")).toBe("https://api.postiz.com/public/v1");
  });

  it("enables auto-posting from a Postiz key alone, without any paid provider", () => {
    expect(hasAutoPostCredentials({ postizApiKey: "pk_free" })).toBe(true);
    expect(isCopyOnlyDistributionMode({ postizApiKey: "pk_free" })).toBe(false);
  });

  it("still falls back to copy-only when nothing is configured", () => {
    expect(hasAutoPostCredentials({})).toBe(false);
    expect(isCopyOnlyDistributionMode({})).toBe(true);
  });
});

describe("publishPostizPost request contract", () => {
  const creds = { postizApiKey: "pk_test", postizApiUrl: "https://postiz.example.com" };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Minimal stub of the two endpoints publishPostizPost touches. */
  function stubPostiz(integrations: unknown, createStatus = 200, createBody = '{"id":"post_1"}') {
    const calls: { url: string; init?: RequestInit }[] = [];
    vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith("/integrations")) {
        return Promise.resolve(new Response(JSON.stringify(integrations), { status: 200 }));
      }
      return Promise.resolve(new Response(createBody, { status: createStatus }));
    });
    return calls;
  }

  it("posts to the resolved integration with the platform's __type discriminator", async () => {
    const calls = stubPostiz([
      { id: "int_x", providerIdentifier: "x" },
      { id: "int_li", providerIdentifier: "linkedin" },
    ]);

    const res = await publishPostizPost(creds, {
      text: "Launch day",
      platforms: ["linkedin"],
      linkUrl: "https://zzaizzai.com",
    });

    expect(res.ok).toBe(true);
    expect(res.id).toBe("post_1");

    const create = calls.find((c) => c.url.endsWith("/posts"));
    expect(create?.url).toBe("https://postiz.example.com/api/public/v1/posts");
    // Postiz uses a raw Authorization value, not a Bearer prefix.
    const headers = create?.init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("pk_test");

    const body = JSON.parse(String(create?.init?.body));
    expect(body.type).toBe("now");
    expect(body.posts).toHaveLength(1);
    expect(body.posts[0].integration.id).toBe("int_li");
    expect(body.posts[0].settings.__type).toBe("linkedin");
    expect(body.posts[0].value[0].content).toContain("https://zzaizzai.com");
  });

  it("maps the twitter alias onto Postiz's x provider", async () => {
    const calls = stubPostiz([{ id: "int_x", providerIdentifier: "x" }]);
    const res = await publishPostizPost(creds, { text: "hi", platforms: ["twitter"] });
    expect(res.ok).toBe(true);
    const body = JSON.parse(String(calls.find((c) => c.url.endsWith("/posts"))?.init?.body));
    expect(body.posts[0].settings.__type).toBe("x");
  });

  it("reports a clear error when no matching channel is connected", async () => {
    stubPostiz([{ id: "int_ms", providerIdentifier: "mastodon" }]);
    const res = await publishPostizPost(creds, { text: "hi", platforms: ["linkedin"] });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/No connected Postiz channel/i);
  });

  it("skips disabled channels", async () => {
    stubPostiz([{ id: "int_li", providerIdentifier: "linkedin", disabled: true }]);
    const res = await publishPostizPost(creds, { text: "hi", platforms: ["linkedin"] });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/No connected Postiz channel/i);
  });

  it("surfaces the hourly create-post rate limit distinctly", async () => {
    stubPostiz([{ id: "int_li", providerIdentifier: "linkedin" }], 429, "rate limited");
    const res = await publishPostizPost(creds, { text: "hi", platforms: ["linkedin"] });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/rate limit/i);
  });

  it("treats a 2xx with an empty body as success", async () => {
    stubPostiz([{ id: "int_li", providerIdentifier: "linkedin" }], 200, "");
    const res = await publishPostizPost(creds, { text: "hi", platforms: ["linkedin"] });
    expect(res.ok).toBe(true);
  });

  it("requires a key before making any request", async () => {
    const res = await publishPostizPost({}, { text: "hi", platforms: ["linkedin"] });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/not configured/i);
  });
});
