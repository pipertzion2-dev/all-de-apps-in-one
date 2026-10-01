export type {
  IfmToolRef,
  IfmPairing,
  IfmProjectConfig,
  IfmStepResult,
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
