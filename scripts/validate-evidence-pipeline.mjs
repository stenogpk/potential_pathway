import { buildExternalVerificationRequest, getEvidenceLabel, getEvidenceLayer, rankEvidenceSources } from "../src/data/evidenceModel.js";
import { buildResearchFallback, createExternalSourceRecord, markExternalVerification } from "../src/data/externalResearch.js";

const userSource = { id: "u1", authority: "user-provided", title: "Master Blueprint.pdf" };
const officialSource = { id: "o1", authority: "official", title: "Exam notification" };
const external = createExternalSourceRecord({
  missionId: "pcs",
  title: "Official commission page",
  url: "https://example.gov/exam",
  publisher: "Exam Commission",
});

if (getEvidenceLayer(userSource) !== "user-source") throw new Error("User source layer failed.");
if (getEvidenceLabel(userSource) !== "User PDF / supplied source") throw new Error("User source label failed.");
if (getEvidenceLayer(officialSource) !== "official") throw new Error("Official source layer failed.");
if (!external || getEvidenceLayer(external) !== "trusted-external") throw new Error("External source layer failed.");

const local = buildResearchFallback({ missionId: "pcs", topic: "polity", localContext: [{ text: "evidence" }] });
if (local.request) throw new Error("External fallback should not trigger when local evidence exists.");

const fallback = buildResearchFallback({ missionId: "pcs", topic: "polity" });
if (fallback.status !== "needs-external-verification" || !fallback.request) throw new Error("External verification request missing.");

const verified = markExternalVerification(external, { note: "Verified against the official page." });
if (verified.status !== "active" || !verified.verification) throw new Error("External verification marking failed.");

const ranked = rankEvidenceSources([officialSource, userSource, verified]);
if (ranked[0].id !== "u1" || ranked[1].id !== "o1") throw new Error("Evidence priority failed.");

const request = buildExternalVerificationRequest({ missionId: "pcs", topic: "economy" });
if (request.requiredLayer !== "trusted-external") throw new Error("Fallback layer failed.");

console.log("Evidence pipeline validation passed.");
