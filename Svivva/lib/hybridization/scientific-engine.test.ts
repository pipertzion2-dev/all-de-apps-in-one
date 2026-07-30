import assert from "node:assert/strict";
import {
  runScientificHybridization,
  schematicFromLoose,
  inferDomainFromText,
} from "./scientific-engine";

assert.equal(inferDomainFromText("copper vapor chamber heatsink"), "thermal");
assert.equal(inferDomainFromText("5G mmwave antenna array"), "rf");

const a = schematicFromLoose({
  name: "Vapor chamber",
  description: "Flat copper two-phase thermal spreader",
});
const b = schematicFromLoose({
  name: "PCB power plane",
  description: "Hierarchical electrical power delivery copper plane",
});

const report = runScientificHybridization({
  schematicA: a,
  schematicB: b,
  hybridizationMode: "complementary",
  targetApplication: "thin consumer SoC module",
  scientificDepth: "prototype",
});

assert.ok(report.scores.hybridViability > 0);
assert.ok(report.scores.domainAffinity >= 50);
assert.ok(report.automaticHybrids.length >= 1);
assert.equal(report.calculatorVersion, "1.0");

console.log("hybridization scientific-engine ok", report.scores);
