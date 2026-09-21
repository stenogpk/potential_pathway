import { buildExternalVerificationRequest, getEvidenceLayer, isVerifiedEvidence } from "./evidenceModel.js";

export function createExternalSourceRecord({
  missionId,
  title,
  url,
  authority = "trusted-external",
  publisher = "",
}) {
  const cleanTitle = String(title || "").trim();
  const cleanUrl = String(url || "").trim();
  if (!missionId || !cleanTitle || !cleanUrl) return null;

  return {
    id: crypto.randomUUID(),
    missionId,
    title: cleanTitle,
    url: cleanUrl,
    publisher: String(publisher || "").trim(),
    authority,
    type: "external-url",
    status: "pending",
    sourceRefs: [],
    addedAt: Date.now(),
  };
}

export function buildResearchFallback({ missionId, topic, localContext = [] }) {
  if (Array.isArray(localContext) && localContext.length) {
    return {
      mode: "user-source",
      status: "grounded-in-user-source",
      request: null,
    };
  }

  return {
    mode: "external-verification",
    status: "needs-external-verification",
    request: buildExternalVerificationRequest({ missionId, topic }),
  };
}

export function canUseExternalEvidence(source) {
  return getEvidenceLayer(source) === "trusted-external" && isVerifiedEvidence(source);
}

export function markExternalVerification(source, verification = {}) {
  if (!source || !canUseExternalEvidence(source)) return source;
  return {
    ...source,
    status: "active",
    verification: {
      verifiedAt: verification.verifiedAt || Date.now(),
      verifiedBy: verification.verifiedBy || "external-research",
      note: String(verification.note || "").trim(),
    },
  };
}
