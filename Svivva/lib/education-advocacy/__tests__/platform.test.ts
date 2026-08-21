import { describe, expect, it } from "vitest";
import {
  bootstrapEducationAdvocacyPlatform,
  buildEducationAdvocacyCaseFile,
  classifyCrisisCategory,
  createEmptyEpv,
  createSelectiveSharePackage,
  createNewVersionFromSealed,
  decryptUtf8,
  encryptUtf8,
  getPreset,
  InternalAppendOnlyLedger,
  orchestrateAdvocacyMix,
  RightsLawEngine,
  routeCrisisHelp,
  runAdvocacyChat,
  sealEpvPackage,
  sha256Hex,
  verifyProofReceipt,
  ChainOfCustody,
  addEvidenceItem,
  CONSOLE_PRESETS,
  CHANNEL_CAPABILITIES,
  ROLE_BOUNDARY,
  scrubForPublicSurface,
} from "../index";

describe("education-advocacy platform", () => {
  it("registers all hybridizable channels with the module registry", () => {
    const adapters = bootstrapEducationAdvocacyPlatform();
    expect(CHANNEL_CAPABILITIES.length).toBe(12);
    expect(adapters.modules.list().length).toBe(12);
  });

  it("exposes editable console presets including crisis and protect", () => {
    expect(CONSOLE_PRESETS.length).toBe(11);
    expect(getPreset("protect_my_education")?.weights.student_rights_law).toBe(90);
    expect(getPreset("i_need_help_now")?.weights.crisis_safety).toBe(100);
    expect(getPreset("education_comeback")?.editable).toBe(true);
  });

  it("raises legal/advocacy/evidence weights for involuntary school exit language", () => {
    const mix = orchestrateAdvocacyMix({
      userText: "My parent is forcing me to leave school.",
      presetId: "education_comeback",
    });
    expect(mix.weights.student_rights_law).toBeGreaterThanOrEqual(50);
    expect(mix.weights.advocacy).toBeGreaterThanOrEqual(50);
    expect(mix.weights.evidence_vault).toBeGreaterThan(20);
    expect(mix.notice).toContain("not medical");
    expect(
      mix.reasons.some((r) => r.reason.includes("involuntary") || r.reason.includes("rights")),
    ).toBe(true);
  });

  it("applies safety override without claiming a medical determination", () => {
    const mix = orchestrateAdvocacyMix({
      userText: "I am in danger and unsafe at home right now",
    });
    expect(mix.safetyOverride).toBe(true);
    expect(mix.weights.crisis_safety).toBe(100);
    expect(mix.weights.human_assistance).toBe(100);
    expect(mix.enabled.crisis_safety).toBe(true);
  });

  it("returns cited legal information and never claims definite illegality", async () => {
    const engine = new RightsLawEngine();
    const result = await engine.query({ country: "US", topic: "privacy" });
    expect(result.distinction.legalAdvice).toBe(false);
    expect(result.distinction.legalInformation).toBe(true);
    expect(result.records.length).toBeGreaterThan(0);
    expect(result.records[0].citation.length).toBeGreaterThan(3);
    expect(result.disclaimers).toContain(ROLE_BOUNDARY);

    const chat = await runAdvocacyChat({
      message: "My parent is forcing me to leave school in California.",
      context: {
        identity: {
          schemaVersion: "ZZAI-EduAdvocate/1.0",
          pseudonymousUserId: "anon_test",
          ageRange: "13_17",
          jurisdiction: { country: "US", stateProvince: "CA" },
        },
      },
    });
    expect(chat.neverClaimsConductDefinitelyIllegal).toBe(true);
    expect(chat.structured.whatIUnderstand.length).toBeGreaterThan(0);
    expect(chat.structured.whatMayMatterLegally.length).toBeGreaterThan(0);
    expect(chat.structured.disclaimers.join(" ")).toContain("not a lawyer");
  });

  it("builds a Protect My Education case file with recording warning", () => {
    const file = buildEducationAdvocacyCaseFile({
      whatHappened: "I was told I must withdraw.",
      dateTime: "2026-03-01T12:00:00Z",
      school: "Example High",
      peopleOrOrganizations: ["Parent"],
      whatUserWanted: "Stay enrolled",
      whatOtherRequestedOrDecided: "Withdraw",
      whatSchoolCommunicated: "Bring withdrawal form",
      documents: [],
      witnesses: [],
      desiredResolution: "Remain enrolled and graduate",
      notes: "",
      audioExplicitlyPermitted: false,
    });
    expect(file.caseId).toMatch(/^case_/);
    expect(file.chronology.length).toBeGreaterThan(1);
    expect(file.warnings.some((w) => w.toLowerCase().includes("recording"))).toBe(true);
  });

  it("encrypts vault content, seals a receipt, and verifies integrity", async () => {
    const custody = new ChainOfCustody();
    let pkg = createEmptyEpv();
    const plaintext = "School email body — sensitive";
    pkg = addEvidenceItem(
      pkg,
      {
        type: "message",
        title: "School email",
        contentHash: sha256Hex(plaintext),
        plaintext,
      },
      custody,
      "test-passphrase-not-for-logs",
    );
    expect(pkg.evidence[0].encrypted?.alg).toBe("aes-256-gcm");
    expect(decryptUtf8(pkg.evidence[0].encrypted!, "test-passphrase-not-for-logs")).toBe(plaintext);

    const ledger = new InternalAppendOnlyLedger();
    const sealed = await sealEpvPackage(pkg, custody, {
      ledger,
      anchorToLedger: true,
      verifyUrlBase: "/education/verify",
    });
    expect(sealed.package.status).toBe("Sealed");
    expect(sealed.receipt.kind).toBe("Education Proof Receipt");
    expect(sealed.receipt.doesNotEstablish.length).toBeGreaterThan(3);
    expect(sealed.receipt.cryptographicFingerprint).toHaveLength(64);

    const verified = verifyProofReceipt({
      receipt: sealed.receipt,
      package: sealed.package,
    });
    expect(verified.statusLabel).toBe("Verified");
    expect(verified.hashMatches).toBe(true);

    const ledgerCheck = await ledger.verifyProof(sealed.receipt.cryptographicFingerprint);
    expect(ledgerCheck.found).toBe(true);

    expect(() =>
      addEvidenceItem(
        sealed.package,
        { type: "note", title: "x", contentHash: sha256Hex("x") },
        custody,
      ),
    ).toThrow(/immutable/);

    const next = createNewVersionFromSealed(sealed.package);
    expect(next.version).toBe(sealed.package.version + 1);
    expect(next.status).toBe("Draft");
    expect(next.priorVersionDigests).toContain(sealed.receipt.cryptographicFingerprint);
  });

  it("supports selective sharing without dumping the full vault", () => {
    const custody = new ChainOfCustody();
    let pkg = createEmptyEpv();
    pkg = addEvidenceItem(
      pkg,
      { type: "pdf", title: "Transcript", contentHash: sha256Hex("t") },
      custody,
    );
    pkg = {
      ...pkg,
      timeline: [{ at: "2026-01-01", summary: "Interruption began" }],
      advocacy: { issue: "Enrollment dispute", requestedResolution: "Re-enroll" },
    };
    const share = createSelectiveSharePackage(pkg, {
      profile: "counselor",
      includeTimeline: true,
      includeAdvocacy: true,
      includeEvidenceIds: [],
    });
    expect(share.package.evidence).toEqual([]);
    expect(share.package.timeline?.length).toBe(1);
    expect(share.manifestDigest).toHaveLength(64);
  });

  it("routes crisis help only from verified directory entries", async () => {
    expect(classifyCrisisCategory("I want to die")).toBe("emotional_psychological_crisis");
    const routed = await routeCrisisHelp({
      text: "I feel suicidal",
      jurisdiction: "US",
    });
    expect(routed.usedVerifiedDirectoryOnly).toBe(true);
    expect(routed.resources.some((r) => r.resource_id === "us-988-lifeline")).toBe(true);
    expect(routed.resources.every((r) => !!r.verified_at && !!r.source)).toBe(true);
  });

  it("scrubs sensitive fields from public surfaces", () => {
    const scrubbed = scrubForPublicSurface({
      proofId: "epr_abc",
      studentName: "Secret",
      recoverySecret: "nope",
      digest: "abc",
    });
    expect(scrubbed.studentName).toBeUndefined();
    expect(scrubbed.recoverySecret).toBeUndefined();
    expect(scrubbed.proofId).toBe("epr_abc");
  });
});
