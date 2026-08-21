import type { SharedContextSnapshot } from "../buses/schemas";
import type {
  AIProvider,
  AiGuideStructuredReply,
  LegalInformationRecord,
} from "../adapters/interfaces";
import { HeuristicAIProvider } from "../adapters/defaults";
import { ROLE_BOUNDARY, LEGAL_INFO_NOT_ADVICE } from "../disclaimers";
import { RightsLawEngine } from "../legal/engine";
import { orchestrateAdvocacyMix } from "../orchestration/engine";
import type { ConsolePresetId } from "../presets";

export type AdvocacyChatRequest = {
  message: string;
  context?: SharedContextSnapshot;
  presetId?: ConsolePresetId;
  ai?: AIProvider;
  legalEngine?: RightsLawEngine;
};

export type AdvocacyChatResponse = {
  structured: AiGuideStructuredReply;
  mix: ReturnType<typeof orchestrateAdvocacyMix>;
  citedLegal: LegalInformationRecord[];
  neverClaimsConductDefinitelyIllegal: true;
};

/**
 * Conversational advocacy guide.
 * Separates understanding, legal information (cited), gaps, steps, helpers, sources, and documentation.
 * Never states conduct is definitely illegal without an authoritative determination (which this system does not make).
 */
export async function runAdvocacyChat(req: AdvocacyChatRequest): Promise<AdvocacyChatResponse> {
  const ai = req.ai || new HeuristicAIProvider();
  const legalEngine = req.legalEngine || new RightsLawEngine();
  const mix = orchestrateAdvocacyMix({
    userText: req.message,
    context: req.context,
    presetId: req.presetId,
  });

  const jurisdiction = req.context?.identity?.jurisdiction || {
    country: req.context?.legal?.country,
    stateProvince: req.context?.legal?.stateProvince,
  };

  const legal = await legalEngine.query({
    country: jurisdiction?.country || "US",
    stateProvince: jurisdiction?.stateProvince,
    topic: inferTopic(req.message),
  });

  const structured =
    (ai.structureAdvocacyReply
      ? await ai.structureAdvocacyReply(req.message, req.context || {})
      : await new HeuristicAIProvider().structureAdvocacyReply(req.message, req.context || {})) ||
    emptyStructured();

  structured.sources = [
    ...structured.sources,
    ...legal.records.slice(0, 5).map((r) => ({
      title: r.title,
      citation: r.citation,
      url: r.sourceUrl,
    })),
  ];
  structured.whatMayMatterLegally = [
    ...structured.whatMayMatterLegally,
    ...legal.records
      .slice(0, 3)
      .map(
        (r) =>
          `${r.plainLanguageExplanation} [${r.citation}] — legal information, not a finding of illegality.`,
      ),
  ];
  if (!structured.disclaimers.includes(ROLE_BOUNDARY)) {
    structured.disclaimers.push(ROLE_BOUNDARY, LEGAL_INFO_NOT_ADVICE);
  }
  if (legal.uncertainty) {
    structured.informationStillMissing.push(
      legal.uncertaintyMessage || "Jurisdiction-matched legal information is incomplete.",
    );
    structured.whoMayBeAbleToHelp.push("Legal aid / attorney referral via Find Legal Help");
  }

  return {
    structured,
    mix,
    citedLegal: legal.records,
    neverClaimsConductDefinitelyIllegal: true,
  };
}

function inferTopic(message: string): string | undefined {
  const lower = message.toLowerCase();
  if (/homeless|housing|couch/.test(lower)) return "homeless";
  if (/iep|504|disability|special ed/.test(lower)) return "disability";
  if (/privacy|records|ferpa/.test(lower)) return "privacy";
  if (/force|withdraw|leave school|attendance|compulsory/.test(lower)) return "compulsory";
  if (/transfer|enroll/.test(lower)) return "enrollment";
  return undefined;
}

function emptyStructured(): AiGuideStructuredReply {
  return {
    whatIUnderstand: [],
    whatMayMatterLegally: [],
    informationStillMissing: [],
    possibleNextSteps: [],
    whoMayBeAbleToHelp: [],
    sources: [],
    protectOrDocument: [],
    disclaimers: [ROLE_BOUNDARY, LEGAL_INFO_NOT_ADVICE],
  };
}
