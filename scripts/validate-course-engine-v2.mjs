import { buildExternalVerificationRequest, getEvidencePolicy, getEvidenceLabel, rankEvidenceSources } from "../src/data/evidenceModel.js";
import { createCourseContent, createEvidenceBlock, courseSectionNames } from "../src/data/courseContent.js";

const user = { id: "u1", authority: "user-provided", title: "Provided PDF" };
const official = { id: "o1", authority: "official", title: "Official notification" };
const trusted = { id: "t1", authority: "trusted-external", title: "Trusted source" };

if (getEvidenceLabel(user) !== "Provided PDF / source") throw new Error("Provided source label failed.");

const ranked = rankEvidenceSources([official, trusted, user], "exam-fact");
if (ranked[0].id !== "u1" || ranked[1].id !== "o1") {
  throw new Error("Provided source must be inspected first, with official external fallback next.");
}

const policy = getEvidencePolicy("current-fact");
if (policy.firstChoice !== "user-source" || !policy.fallbackLayers.includes("official")) {
  throw new Error("Current-fact evidence policy failed.");
}

const request = buildExternalVerificationRequest({
  missionId: "pcs",
  topic: "test topic",
  claimType: "current-fact",
});
if (request.requiredLayer !== "official" || request.status !== "needs-external-verification") {
  throw new Error("External fallback request did not prefer official verification.");
}

const block = createEvidenceBlock({
  text: "Exact source-backed evidence.",
  sourceId: "u1",
  chunkId: "c1",
  evidenceLayer: "user-source",
});
const content = createCourseContent({
  missionId: "pcs",
  title: "Structured topic",
  body: "Source-backed draft.",
  sections: {
    core: [block],
    crux: [],
    details: [],
    facts: [],
    mcqTargets: [],
    revisionPoints: [],
  },
});
if (!content) throw new Error("Structured course content was not created.");
if (courseSectionNames.some((name) => !Array.isArray(content.sections[name]))) {
  throw new Error("Structured course sections are incomplete.");
}
if (!content.sourceRefs.includes("u1") || !content.sourceChunkRefs.includes("c1")) {
  throw new Error("Evidence provenance was not propagated into course content.");
}

console.log("Course engine v2 evidence policy validation passed.");
