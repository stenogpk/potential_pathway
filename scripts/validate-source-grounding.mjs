import { buildSourceContext, sourceContextText } from "../src/data/sourceContext.js";
import { buildCourseGrounding, canGenerateGroundedCourse } from "../src/data/courseGrounding.js";
import { filterSourceGroundedQuestions, validateQuestionProvenance } from "../src/data/questionValidation.js";

const chunks = [
  { id: "c1", sourceId: "s1", missionId: "pcs", locator: "notes.md#1", text: "Indian Constitution fundamentals and federal features.", order: 0 },
  { id: "c2", sourceId: "s2", missionId: "pcs", locator: "notes.md#2", text: "Parliament and legislative procedure.", order: 1 },
];

const context = buildSourceContext(chunks, "Constitution federal", { missionId: "pcs" });
if (context.length !== 1 || context[0].sourceId !== "s1") throw new Error("Source context retrieval failed.");
if (!sourceContextText(context).includes("federal features")) throw new Error("Context formatting failed.");

const grounding = buildCourseGrounding({ chunks, missionId: "pcs", topic: "Constitution" });
if (!canGenerateGroundedCourse(grounding)) throw new Error("Grounding gate failed.");

const good = { id: "q1", missionId: "pcs", stem: "Question", sourceRefs: ["s1"] };
const bad = { id: "q2", missionId: "pcs", stem: "Question", sourceRefs: ["missing"] };
if (!validateQuestionProvenance(good, ["s1"]).valid) throw new Error("Valid provenance rejected.");
if (validateQuestionProvenance(bad, ["s1"]).valid) throw new Error("Unknown provenance accepted.");
if (filterSourceGroundedQuestions([good, bad], ["s1"]).length !== 1) throw new Error("Question filtering failed.");

console.log("Source grounding validation passed.");
