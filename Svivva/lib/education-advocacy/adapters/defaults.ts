import { createHash, randomUUID } from "crypto";
import type {
  AIProvider,
  AiGuideStructuredReply,
  CrisisResourceProvider,
  HumanReferralProvider,
  IdentityProvider,
  LedgerAdapter,
  LegalSourceProvider,
  ModuleRegistration,
  ModuleRegistry,
  NotificationProvider,
  OpportunityProvider,
  ResourceProvider,
  ResourceRecord,
  SchoolDataProvider,
  StorageProvider,
} from "./interfaces";
import { LEGAL_INFO_NOT_ADVICE, ROLE_BOUNDARY } from "../disclaimers";
import type { SharedContextSnapshot } from "../buses/schemas";
import { InternalAppendOnlyLedger } from "../ledger/internal";
import { InMemoryLegalCatalog } from "../legal/catalog";
import { InMemoryResourceRegistry } from "../resources/registry";

export class InMemoryModuleRegistry implements ModuleRegistry {
  private mods = new Map<string, ModuleRegistration>();
  register(mod: ModuleRegistration): void {
    this.mods.set(mod.id, mod);
  }
  list(): ModuleRegistration[] {
    return [...this.mods.values()];
  }
  get(id: string): ModuleRegistration | undefined {
    return this.mods.get(id);
  }
}

export class PseudonymousIdentityProvider implements IdentityProvider {
  id = "pseudonymous-local";
  constructor(private fixedId?: string) {}
  async getPseudonymousId(): Promise<string> {
    return this.fixedId || `anon_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  }
}

export class MemoryStorageProvider implements StorageProvider {
  id = "memory-storage";
  private store = new Map<string, Uint8Array>();
  async putEncrypted(key: string, ciphertext: Uint8Array): Promise<void> {
    this.store.set(key, ciphertext);
  }
  async getEncrypted(key: string): Promise<Uint8Array | null> {
    return this.store.get(key) || null;
  }
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export class NoopNotificationProvider implements NotificationProvider {
  id = "noop-notifications";
  async notify(): Promise<void> {
    /* intentionally empty — lock-screen-safe by default */
  }
}

export class HeuristicAIProvider implements AIProvider {
  id = "heuristic-ai-guide";

  async complete(messages: { role: string; content: string }[]): Promise<string> {
    const last = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const structured = await this.structureAdvocacyReply(last, {});
    return JSON.stringify(structured, null, 2);
  }

  async structureAdvocacyReply(
    userText: string,
    context: SharedContextSnapshot,
  ): Promise<AiGuideStructuredReply> {
    const lower = userText.toLowerCase();
    const missing: string[] = [];
    if (!context.identity?.ageRange || context.identity.ageRange === "unknown") {
      missing.push("Age range (helps route age-appropriate resources)");
    }
    if (!context.identity?.jurisdiction?.stateProvince && !context.legal?.stateProvince) {
      missing.push("State / province (jurisdiction for rights information)");
    }
    if (
      !context.education?.currentSchoolStatus ||
      context.education.currentSchoolStatus === "unknown"
    ) {
      missing.push("Current enrollment / school status");
    }

    const legalHints: string[] = [];
    if (/force|forcing|leave school|withdraw|dropout|drop out/.test(lower)) {
      legalHints.push(
        "Compulsory attendance and withdrawal rules vary by jurisdiction and age — this is legal information, not a determination that anyone broke the law.",
      );
    }
    if (/transfer|moved|housing|homeless|couch/.test(lower)) {
      legalHints.push(
        "School stability and residency rules (including McKinney-Vento in the U.S. for eligible students) may be relevant — verify with cited sources.",
      );
    }
    if (/iep|504|special ed|disability/.test(lower)) {
      legalHints.push(
        "Disability-related educational protections may apply depending on eligibility — cite the underlying statute or guidance when discussing them.",
      );
    }
    if (legalHints.length === 0) {
      legalHints.push(
        "No specific legal topic confidently identified yet; more context may be needed before citing sources.",
      );
    }

    const unsafe = /unsafe|hurt|kill|suicide|abuse|weapon|threat/.test(lower);

    return {
      whatIUnderstand: [
        userText.trim().slice(0, 500) || "You described a situation affecting your education.",
        context.education?.desiredOutcome
          ? `Desired outcome noted: ${context.education.desiredOutcome}`
          : "Desired educational outcome not yet stated.",
      ],
      whatMayMatterLegally: legalHints,
      informationStillMissing: missing,
      possibleNextSteps: unsafe
        ? [
            "If you are in immediate danger, contact local emergency services.",
            "Use I Need Help Now for verified crisis resources in your area.",
            "Consider documenting key facts in Protect My Education when you are safe.",
          ]
        : [
            "Use Protect My Education to capture what happened in your own words.",
            "Open Know My Rights for jurisdiction-tagged legal information with citations.",
            "Optionally seal records in the Education Proof Vault for integrity — not legal proof of wrongdoing.",
          ],
      whoMayBeAbleToHelp: [
        "School counselor or trusted adult",
        "Education advocate or youth advocate",
        "Legal aid / attorney referral (when rights questions remain uncertain)",
      ],
      sources: [],
      protectOrDocument: [
        "Save dates, school names you choose to record, and copies of messages/documents you already have.",
        "Do not secretly record people; recording laws differ by jurisdiction.",
      ],
      disclaimers: [ROLE_BOUNDARY, LEGAL_INFO_NOT_ADVICE],
    };
  }
}

export type DefaultAdapterBundle = {
  legal: LegalSourceProvider;
  resources: ResourceProvider & CrisisResourceProvider;
  human: HumanReferralProvider;
  ai: AIProvider;
  ledger: LedgerAdapter;
  identity: IdentityProvider;
  notifications: NotificationProvider;
  storage: StorageProvider;
  school: SchoolDataProvider;
  opportunities: OpportunityProvider;
  modules: ModuleRegistry;
};

export function createDefaultAdapters(): DefaultAdapterBundle {
  const legal = new InMemoryLegalCatalog();
  const resources = new InMemoryResourceRegistry();
  const ledger = new InternalAppendOnlyLedger();
  return {
    legal,
    resources,
    human: {
      id: "default-human-referral",
      search: (q) => resources.search(q),
      async checkEligibility() {
        return {
          eligible: true,
          reason: "Directory listing — confirm eligibility with the provider.",
        };
      },
      async getAvailability(resourceId) {
        const r = await resources.getById(resourceId);
        return { available: !!r, hours: r?.hours };
      },
      async createReferral(req) {
        return {
          referralId: `ref_${createHash("sha256")
            .update(req.resourceId + req.userRef)
            .digest("hex")
            .slice(0, 16)}`,
          status: "created",
          nextStep: "Contact the organization using the verified channel listed in the registry.",
        };
      },
      async shareAuthorizedPacket() {
        return { shared: true };
      },
    },
    ai: new HeuristicAIProvider(),
    ledger,
    identity: new PseudonymousIdentityProvider(),
    notifications: new NoopNotificationProvider(),
    storage: new MemoryStorageProvider(),
    school: {
      id: "noop-school",
      async lookupSchool() {
        return [];
      },
    },
    opportunities: {
      id: "opportunities-from-registry",
      search: (q) => resources.search({ ...q, type: q.type || "opportunity" }),
    },
    modules: new InMemoryModuleRegistry(),
  };
}

export function filterUnexpired(resources: ResourceRecord[], now = new Date()): ResourceRecord[] {
  return resources.filter((r) => {
    if (!r.expires_at) return true;
    return new Date(r.expires_at).getTime() >= now.getTime();
  });
}
