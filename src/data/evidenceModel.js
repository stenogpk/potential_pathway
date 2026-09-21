export const evidenceLayers = [
  "user-source",
  "official",
  "trusted-external",
  "secondary",
  "model-only",
];

export const evidenceLabels = {
  "user-source": "User PDF / supplied source",
  official: "Official source",
  "trusted-external": "Trusted external source",
  secondary: "Secondary source",
  "model-only": "Model knowledge — not verified",
};

export const evidencePriority = {
  "user-source": 1,
  official: 2,
  "trusted-external": 3,
  secondary: 4,
  "model-only": 99,
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
  const layer = getEvidenceLayer(source);
  return layer !== "model-only";
}

export function buildExternalVerificationRequest({ missionId, topic, reason = "No matching user-supplied source evidence was found." }) {
  return {
    missionId,
    topic: String(topic || "").trim(),
    reason,
    requiredLayer: "trusted-external",
    status: "needs-external-verification",
    createdAt: Date.now(),
  };
}

export function rankEvidenceSources(sources = []) {
  return [...sources].sort(
    (a, b) => (evidencePriority[getEvidenceLayer(a)] || 99) - (evidencePriority[getEvidenceLayer(b)] || 99)
  );
}
