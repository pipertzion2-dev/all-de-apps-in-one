import { FEATURES, type FeatureId } from "@/components/svivva-artifact/feature-defs";

/** Marketing copy for the six-face homepage cube as a launcher suite — not one monolithic app. */
export const CUBE_SUITE = {
  name: "ZZAI Cube Suite",
  passName: "Suite Pass",
  launcherHeadline: "Six mini apps. One cube launcher.",
  launcherSubhead:
    "Each cube face opens its own focused mini app — drag to browse, tap to launch. Your plan is a Suite Pass for the apps you need.",
  subscriptionHeadline: "One Suite Pass. Six mini apps.",
  subscriptionSubhead:
    "Subscribe once — unlock the cube mini apps below. No single bloated dashboard; each app keeps its own job.",
  unifiedValueHeadline:
    "Separate mini apps, one connected brain — easier than paying for six SaaS tools that never talk.",
  vsManySaasTitle: "Not six SaaS subscriptions",
  vsManySaasBody:
    "Stacking Play, API, SEO, and hardware tools means six logins, six bills, and copy-paste between products. Suite Pass is one payment; the suite stays separate on the cube but shares context on the master bus.",
  sharedBrainTitle: "One mixing-console brain",
  sharedBrainBody:
    "Orchestration-as-a-Service (OaaS) is the shared brain: Signal, Crest, Aux, Grow, and Protect route like channels on one desk — not brittle Zapier chains between vendors.",
  dualCreationTitle: "Ideas from two ways of creating",
  dualCreationBody:
    "Many builds start twice — a Seeds brief and a Hardware sketch, Digital API logic and Play audio, Orbit launch plus Protect seals. Hybrid flows blend both parents on the same bus instead of choosing one SaaS stack.",
  /** One line under the cube hero */
  launcherBrainHint:
    "One mixing-console brain links every face — including ideas that start two ways (seed + sketch, API + audio).",
} as const;

export type CubeSuiteMiniApp = {
  id: FeatureId;
  shortLabel: string;
  title: string;
  blurb: string;
  href: string;
  accentColor: string;
};

/** Cube faces in product order (matches homepage nav grid). */
export function listCubeSuiteMiniApps(): CubeSuiteMiniApp[] {
  return FEATURES.map((f) => ({
    id: f.id,
    shortLabel: f.shortLabel,
    title: f.name,
    blurb: f.tagline,
    href: f.cta.href,
    accentColor: f.accentColor,
  }));
}

/** Comma-separated mini app names for compact labels (e.g. checkout). */
export function cubeSuiteMiniAppNamesLine(): string {
  return listCubeSuiteMiniApps()
    .map((a) => a.shortLabel)
    .join(" · ");
}
