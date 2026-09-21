import { buildGroundedCourseDraft } from "../src/data/courseGeneration.js";
import { validateCourseContentProvenance, filterValidCourseContent } from "../src/data/courseContentValidation.js";
import { courseGenerationGate } from "../src/data/courseGenerationGate.js";

const chunks = [
  { id: "c1", sourceId: "s1", missionId: "pcs", locator: "notes.md#1", text: "Federal features of the Constitution.", order: 0 },
  { id: "c2", sourceId: "s2", missionId: "pcs", locator: "notes.md#2", text: "Parliamentary procedure.", order: 1 },
];

const draft = buildGroundedCourseDraft({ chunks, missionId: "pcs", topic: "Constitution federal" });
if (!draft.generated || draft.content.length !== 1) throw new Error("Grounded course draft generation failed.");

const content = draft.content[0];
if (!validateCourseContentProvenance(content, ["s1"], ["c1"]).valid) {
  throw new Error("Valid course provenance was rejected.");
}

const bad = { ...content, sourceRefs: ["missing"] };
if (filterValidCourseContent([content, bad], ["s1"], ["c1"]).length !== 1) {
  throw new Error("Invalid course provenance was accepted.");
}

const blocked = courseGenerationGate({ chunks, missionId: "pcs", topic: "Astrophysics" });
if (blocked.allowed) throw new Error("Course generation gate allowed an unsupported topic.");

console.log("Course builder validation passed.");
