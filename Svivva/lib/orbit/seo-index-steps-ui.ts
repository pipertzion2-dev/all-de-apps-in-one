import type { LucideIcon } from "lucide-react";
import {
  Search,
  Shield,
  Eye,
  Link2,
  FileText,
  Gauge,
  Target,
  Activity,
  Sparkles,
} from "lucide-react";
import { SEO_INDEX_PHASES } from "@/lib/orbit/seo-index-phases";

export type OrbitStepUi = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  estimate?: string;
  needsTools?: boolean;
  auto?: string[];
  manual?: string[];
};

const ICONS: LucideIcon[] = [
  Search,
  Shield,
  Eye,
  Link2,
  FileText,
  Gauge,
  Target,
  Activity,
  Sparkles,
];

/** Launchpad step cards for Index 22 (9 phases). */
export function buildIndex22OrbitSteps(): OrbitStepUi[] {
  return SEO_INDEX_PHASES.map((p, i) => ({
    id: p.id,
    title: `Phase ${p.phase}: ${p.title}`,
    icon: ICONS[i] ?? Search,
    estimate: "~30–90s",
    description: p.subtitle,
    auto: p.objectives,
    manual: [
      ...p.deliverables.slice(0, 3),
      "Reports: seo-reports/ (on server) or /dashboard/seo-health",
    ],
  }));
}
