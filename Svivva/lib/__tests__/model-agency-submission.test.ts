import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { emptyModelAgencyDraft } from "../events/model-agency/default-draft";
import {
  buildSubmissionPack,
  compCardReady,
  submissionEmailSubject,
} from "../events/model-agency/submission-pack";

describe("model agency submission pack", () => {
  it("builds industry-style email subject", () => {
    const draft = emptyModelAgencyDraft();
    draft.contact.legalName = "Jordan Lee";
    draft.contact.city = "Brooklyn";
    draft.measurements.heightCm = 178;
    draft.lanes = ["commercial"];
    expect(submissionEmailSubject(draft, "commercial")).toBe(
      "Jordan Lee | Brooklyn | 178 cm | Commercial",
    );
  });

  it("requires hero and key digitals for built comp", () => {
    const draft = emptyModelAgencyDraft();
    expect(compCardReady(draft)).toBe(false);
    draft.images.hero = "data:image/png;base64,abc";
    draft.images.headshot = "data:image/png;base64,def";
    draft.images.fullBody = "data:image/png;base64,ghi";
    expect(compCardReady(draft)).toBe(true);
  });

  it("includes scam warnings in pack", () => {
    const pack = buildSubmissionPack(emptyModelAgencyDraft());
    expect(pack.warnings.some((w) => w.includes("upfront"))).toBe(true);
  });

  it("ships events UI for comp-card-first agency flow", () => {
    const flowSrc = readFileSync(
      resolve(__dirname, "../../components/events/model-agency-signing-flow.tsx"),
      "utf8",
    );
    const pageSrc = readFileSync(
      resolve(__dirname, "../../app/events/model-agency/page.tsx"),
      "utf8",
    );
    expect(flowSrc).toContain("ModelCompCardPreview");
    expect(flowSrc).toContain("buildSubmissionPack");
    expect(pageSrc).toContain("ModelAgencySigningFlow");
  });
});
