import { buildGroundedCourseDraft } from "../src/data/courseGeneration.js";
import { validateCourseContentProvenance, filterValidCourseContent } from "../src/data/courseContentValidation.js";
import { courseGenerationGate } from "../src/data/courseGenerationGate.js";
import { courseSectionNames } from "../src/data/courseContent.js";

const chunks = [
  { id: "c1", sourceId: "s1", missionId: "pcs", locator: "notes.md#1", text: "Federal features of the Constitution were established in 1950.", order: 0 },
  { id: "c2", sourceId: "s2", missionId: "pcs", locator: "notes.md#2", text: "Parliamentary procedure.", order: 1 },
  { id: "c3", sourceId: "s1", missionId: "pcs", locator: "notes.md#3", text: "The term began in 1950.", order: 2 },
];

const draft = buildGroundedCourseDraft({ chunks, missionId: "pcs", topic: "Constitution federal" });
if (!draft.generated || draft.content.length !== 1) throw new Error("Structured course draft generation failed.");

const content = draft.content[0];
if (!validateCourseContentProvenance(content, ["s1", "s2"], ["c1", "c2", "c3"]).valid) throw new Error("Valid course provenance was rejected.");
if (courseSectionNames.some((name) => !Array.isArray(content.sections[name]))) throw new Error("Course section contract is incomplete.");
if (!content.sections.core.length || !content.sections.mcqTargets.length || !content.sections.revisionPoints.length) {
  throw new Error("Required structured course sections were not populated.");
}
if (content.sections.crux.length || content.sections.details.length) {
  throw new Error("Test expected only evidence-supported sections to be populated; unsupported sections must remain empty.");
}
if (!content.sections.facts.length) {
  throw new Error("Numeric source evidence was not routed to Facts.");
}
if (!content.sourceRefs.includes("s1") || !content.sourceChunkRefs.includes("c1")) throw new Error("Course provenance was not propagated.");

const bad = { ...content, sourceRefs: ["missing"] };
if (filterValidCourseContent([content, bad], ["s1", "s2"], ["c1", "c2", "c3"]).length !== 1) throw new Error("Invalid course provenance was accepted.");

const blocked = courseGenerationGate({ chunks, missionId: "pcs", topic: "Astrophysics" });
if (blocked.allowed) throw new Error("Course generation gate allowed an unsupported topic.");

console.log("Structured course engine v2 validation passed.");
