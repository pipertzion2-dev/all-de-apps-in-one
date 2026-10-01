export type {
  IfmToolRef,
  IfmPairing,
  IfmPairingScore,
  IfmProjectConfig,
  IfmStepResult,
  IfmPerformanceSummary,
  GenerateIfmPairingsInput,
} from "./ifm-types";

export {
  generateIfmPairings,
  buildIfmPairing,
  deriveFusionTitle,
  pairKey,
  listIfmToolFamilies,
} from "./intent-fusion-matrix";

export {
  parseIfmConfig,
  getIfmPairingsForProject,
  appendIfmPairings,
  replaceIfmPairings,
  persistIfmPairingEntities,
  updateIfmProjectConfig,
} from "./ifm-repository";

export { runIfmStep } from "./run-ifm-step";
export { buildIfmBridgePageDraft } from "./bridge-page-generator";
export { shipIfmBridgesForProject } from "./ship-ifm-bridges";
export type { ShipIfmBridgesSummary } from "./ship-ifm-bridges";
export {
  rescoreIfmPairingsForProject,
  expandIfmPairFromWinner,
  pruneIfmPairing,
  scoreIfmPairing,
  buildIfmLeaderboard,
  DEFAULT_IFM_WINNER_THRESHOLD,
  DEFAULT_IFM_PRUNE_THRESHOLD,
} from "./ifm-performance";
