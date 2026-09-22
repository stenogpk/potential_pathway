import { buildExternalVerificationRequest, getEvidenceLayer, isVerifiedEvidence } from "./evidenceModel.js";
import { isTrustedExternalUrl } from "./trustedSources.js";
import { createContentChunk } from "./contentModel.js";
import { splitTextIntoChunks } from "./textExtractor.js";

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
  if ((authority === "trusted-external" || authority === "official") && !isTrustedExternalUrl(cleanUrl)) return null;

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
  return ["official", "trusted-external"].includes(getEvidenceLayer(source)) &&
    isVerifiedEvidence(source) &&
    isTrustedExternalUrl(source.url);
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

export function ingestExternalEvidence({ source, text, maxLength = 1400 }) {
  if (!source || !canUseExternalEvidence(source)) {
    throw new Error("Only a verified trusted-external source can provide external evidence.");
  }
  const parts = splitTextIntoChunks(String(text || ""), { maxLength });
  if (!parts.length) throw new Error("External source contains no indexable evidence.");

  const chunks = parts.map((part, index) => createContentChunk({
    id: source.id + ":external-" + (index + 1),
    sourceId: source.id,
    missionId: source.missionId,
    locator: source.url + "#evidence-" + (index + 1),
    text: part,
    order: index,
    evidenceLayer: getEvidenceLayer(source),
    sourceUrl: source.url,
    publisher: source.publisher || null,
  })).filter(Boolean);

  return { chunks, chunkCount: chunks.length };
}
