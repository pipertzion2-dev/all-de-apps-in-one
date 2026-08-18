export type OrbitRoadmapItemStatus = "proposed" | "approved" | "shipped" | "archived";

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
  status: OrbitRoadmapItemStatus;
  promotedAt: string;
  microToolShipped?: boolean;
  notes?: string;
};

export type OrbitRoadmapConfig = {
  items?: OrbitRoadmapItem[];
  lastPromotedAt?: string;
  autoPromote?: boolean;
  promoteScoreThreshold?: number;
};

export type PromoteIfmWinnersResult = {
  promoted: number;
  skipped: number;
  items: OrbitRoadmapItem[];
};
