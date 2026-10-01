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
  persistIfmPairingEntities,
  updateIfmProjectConfig,
} from "./ifm-repository";

export { runIfmStep } from "./run-ifm-step";
