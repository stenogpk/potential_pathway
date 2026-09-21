export const evidenceLayers = [
  "user-source",
  "official",
  "trusted-external",
  "secondary",
  "model-only",
];

export const evidenceLabels = {
  "user-source": "Provided PDF / source",
  official: "Official external source",
  "trusted-external": "Trusted external source",
  secondary: "Secondary external source",
  "model-only": "Model knowledge — not verified",
};

export const evidencePriority = {
  "user-source": 1,
  official: 2,
  "trusted-external": 3,
  secondary: 4,
  "model-only": 99,
};

export const claimTypes = [
  "course-content",
  "exam-fact",
  "current-fact",
  "definition",
  "practice-question",
];

export const evidencePolicy = {
  default: {
    firstChoice: "user-source",
    fallbackLayers: ["official", "trusted-external", "secondary"],
    modelAllowed: false,
  },
  "course-content": {
    firstChoice: "user-source",
    fallbackLayers: ["official", "trusted-external", "secondary"],
    modelAllowed: false,
  },
  "exam-fact": {
    firstChoice: "user-source",
    fallbackLayers: ["official", "trusted-external"],
    modelAllowed: false,
  },
  "current-fact": {
    firstChoice: "user-source",
    fallbackLayers: ["official", "trusted-external"],
    modelAllowed: false,
  },
  definition: {
    firstChoice: "user-source",
    fallbackLayers: ["official", "trusted-external", "secondary"],
    modelAllowed: false,
  },
  "practice-question": {
    firstChoice: "user-source",
    fallbackLayers: ["official", "trusted-external"],
    modelAllowed: false,
  },
};

export function getEvidenceLayer(source = {}) {
  if (source.authority === "official") return "official";
  if (source.authority === "trusted-external") return "trusted-external";
  if (source.authority === "secondary") return "secondary";
  if (source.authority === "model-only") return "model-only";
  return "user-source";
}

export function getEvidenceLabel(source) {
  return evidenceLabels[getEvidenceLayer(source)] || "Unclassified source";
}

export function isVerifiedEvidence(source) {
  return getEvidenceLayer(source) !== "model-only";
}

export function getEvidencePolicy(claimType = "default") {
  return evidencePolicy[claimType] || evidencePolicy.default;
}

export function buildExternalVerificationRequest({
  missionId,
  topic,
  reason = "The provided source does not clearly support this topic or claim.",
  claimType = "course-content",
}) {
  const policy = getEvidencePolicy(claimType);
  return {
    missionId,
    topic: String(topic || "").trim(),
    reason,
    claimType,
    requiredLayer: policy.fallbackLayers[0] || "trusted-external",
    status: "needs-external-verification",
    createdAt: Date.now(),
  };
}

export function rankEvidenceSources(sources = [], claimType = "default") {
  const policy = getEvidencePolicy(claimType);
  const order = [policy.firstChoice, ...policy.fallbackLayers, "model-only"];
  return [...sources].sort(
    (a, b) => order.indexOf(getEvidenceLayer(a)) - order.indexOf(getEvidenceLayer(b))
  );
}
