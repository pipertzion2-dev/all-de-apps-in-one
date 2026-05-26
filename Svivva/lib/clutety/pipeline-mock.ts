/** Demo pipeline responses when Pyracrypt FastAPI backend is not deployed. */

export function mockHypotheses(system: string) {
  return [
    {
      hypothesis: `Exposed attack surface on ${system} — auth boundary gaps`,
      confidence: 0.86,
    },
    {
      hypothesis: `Feed injection / recommendation manipulation vectors for ${system}`,
      confidence: 0.74,
    },
    {
      hypothesis: `Third-party embed and tracker leakage from ${system}`,
      confidence: 0.68,
    },
  ];
}

export function mockCombine(system: string) {
  const label = system.slice(0, 24) || "target";
  return {
    new_structure: {
      description: `Combined graph for ${label}`,
      nodes: [
        { node_id: "edge", label: "Edge / CDN" },
        { node_id: "api", label: "API Gateway" },
        { node_id: "feed", label: "Feed Ranker" },
        { node_id: "store", label: "User Data" },
      ],
      edges: [
        { id: "e1", from: "edge", to: "api", trust: 0.55 },
        { id: "e2", from: "api", to: "feed", trust: 0.42 },
        { id: "e3", from: "feed", to: "store", trust: 0.38 },
      ],
    },
    explanation: "Merged surface, feed, and data paths into one analyzable structure.",
  };
}

export function mockMutate() {
  return {
    mutations: ["strip-metadata", "shuffle-rank-keys", "delay-embed"],
    findings: [
      { mutation: "strip-metadata", failure: null, vulnerable: false },
      { mutation: "shuffle-rank-keys", failure: "ranker accepted poisoned key", vulnerable: true },
      { mutation: "delay-embed", failure: null, vulnerable: false },
    ],
  };
}

export function mockSimulate(hypothesis: string) {
  return {
    attack_steps: [
      `Probe ${hypothesis.slice(0, 40)}…`,
      "Enumerate feed endpoints and recommendation parameters",
      "Attempt content injection via malformed engagement signals",
      "Validate whether blocked categories can bypass filters",
    ],
  };
}

export function mockRemedy(attack: { hypothesis?: string }) {
  const h = attack?.hypothesis || "feed surface";
  return {
    fix: "Enable Clutety feed shields + tighten ranker input validation",
    explanation: `Remediation plan generated for: ${h}`,
    improved_architecture:
      "Zero-trust feed ingress, category blocklists, and local-only preference storage.",
  };
}
