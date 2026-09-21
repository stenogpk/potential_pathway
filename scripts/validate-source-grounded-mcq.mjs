import { createGroundedQuestion } from "../src/data/mcqContent.js";
import { buildSourceGrounding, canGenerateGroundedQuestion } from "../src/data/questionGenerationGate.js";
import { validateGroundedQuestion, filterGroundedQuestions } from "../src/data/questionProvenance.js";
import { addGroundedQuestion } from "../src/data/mcqBank.js";
import { createAttemptRecord } from "../src/data/questions.js";

const chunks = [
  { id: "c1", sourceId: "s1", missionId: "pcs", locator: "notes.md#1", text: "The Constitution establishes a parliamentary system.", order: 0 },
  { id: "c2", sourceId: "s1", missionId: "pcs", locator: "notes.md#2", text: "The Council of Ministers is collectively responsible to the Lok Sabha.", order: 1 },
];

const grounding = buildSourceGrounding({ chunks, missionId: "pcs", topic: "parliamentary system" });
if (!canGenerateGroundedQuestion(grounding)) throw new Error("Expected source grounding to be available.");

const question = createGroundedQuestion({
  missionId: "pcs",
  topicId: "polity-parliament",
  questionType: "concept",
  stem: "Which system is described by the supplied source?",
  options: [{ id: "a", text: "Parliamentary system" }, { id: "b", text: "Presidential system" }],
  correctOptionId: "a",
  explanation: "The answer is grounded in the supplied source chunk.",
  difficulty: "easy",
  sourceRefs: ["s1"],
  sourceChunkRefs: ["c1"],
  tags: ["source-grounded"],
});
if (!validateGroundedQuestion(question, ["s1"], ["c1"]).valid) throw new Error("Valid grounded question was rejected.");

const pyq = createGroundedQuestion({
  missionId: "pcs",
  topicId: "polity-parliament",
  questionType: "pyq",
  stem: "Which system is described by the supplied source?",
  options: [{ id: "a", text: "Parliamentary system" }, { id: "b", text: "Presidential system" }],
  correctOptionId: "a",
  explanation: "Source-grounded PYQ record.",
  pyq: { year: 2024, exam: "PCS", paper: "GS" },
  marking: { correct: 3, wrong: -1, unanswered: 0 },
  sourceRefs: ["s1"],
  sourceChunkRefs: ["c1"],
  tags: ["pyq"],
});
if (!validateGroundedQuestion(pyq, ["s1"], ["c1"]).valid) throw new Error("Valid PYQ metadata was rejected.");

const attempt = createAttemptRecord({ question: pyq, selectedOptionId: "b", timeSeconds: 12, errorType: "concept-confusion" });
if (!attempt || attempt.isCorrect || attempt.marks !== -1 || attempt.errorType !== "concept-confusion") {
  throw new Error("Negative marking or error linkage failed.");
}

const invalid = { ...question, sourceChunkRefs: ["missing"] };
if (filterGroundedQuestions([question, invalid], ["s1"], ["c1"]).length !== 1) throw new Error("Invalid grounded question was accepted.");

const bank = addGroundedQuestion([], question, ["s1"], ["c1"]);
if (bank.length !== 1) throw new Error("Grounded question was not added to the bank.");

const blocked = buildSourceGrounding({ chunks, missionId: "pcs", topic: "astrophysics" });
if (canGenerateGroundedQuestion(blocked)) throw new Error("Unsupported topic passed the source gate.");

console.log("Source-grounded MCQ v2 validation passed.");
