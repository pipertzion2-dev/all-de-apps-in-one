export type OrbitRoadmapItemStatus = "proposed" | "approved" | "shipped" | "archived";

export type IfmFusionProductSpec = {
  slug: string;
  fusionTitle: string;
  toolAPath: string;
  toolBPath: string;
  toolAName: string;
  toolBName: string;
  microToolIdea?: string;
  hub: "ai-tools-hub" | "cyber-security-mini-apps" | "seo-pack";
  keyword: string;
  description: string;
  workflowSteps: string[];
};

export type OrbitRoadmapItem = {
  id: string;
  pairingId: string;
  fusionTitle: string;
  slug: string;
  toolAPath: string;
  toolBPath: string;
  toolAName: string;
  toolBName: string;
  score: number;
  sessions7d?: number;
  conversions7d?: number;
  rescoreTotal?: number;
  status: OrbitRoadmapItemStatus;
  promotedAt: string;
  microToolShipped?: boolean;
  productSpec?: IfmFusionProductSpec;
  approvedAt?: string;
  shippedAt?: string;
  productUrl?: string;
  notes?: string;
};

export type OrbitRoadmapConfig = {
  items?: OrbitRoadmapItem[];
  lastPromotedAt?: string;
  autoPromote?: boolean;
  promoteScoreThreshold?: number;
  approvalMode?: "manual" | "assisted" | "autonomous";
  autoApprove?: boolean;
  approveScoreThreshold?: number;
  lastApprovedAt?: string;
  autoShip?: boolean;
  shipScoreThreshold?: number;
  lastShippedAt?: string;
};

export type PromoteIfmWinnersResult = {
  promoted: number;
  skipped: number;
  items: OrbitRoadmapItem[];
};
