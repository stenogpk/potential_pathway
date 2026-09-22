import assert from "node:assert/strict";
import { buildStudyPlan } from "../src/data/planner.js";

const now = Date.now();
const sourceIds = ["source-1"];
const chunkIds = ["chunk-1"];

const groundedPyq = {
  id: "pyq-1",
  missionId: "pcs",
  topicId: "polity",
  questionType: "pyq",
  pyq: { year: 2024, exam: "PCS", paper: "GS" },
  sourceRefs: sourceIds,
  sourceChunkRefs: chunkIds,
  evidenceLayers: ["user-source"],
  stem: "Grounded PYQ",
  options: [{ id: "a", text: "A" }, { id: "b", text: "B" }],
  correctOptionId: "a",
  explanation: "Source-backed explanation.",
};

const plan = buildStudyPlan({
  missionId: "pcs",
  availableMinutes: 30,
  attempts: [
    { id: "a1", missionId: "pcs", questionId: "q1", topicId: "polity", isCorrect: false, errorType: "concept-confusion" },
    { id: "a2", missionId: "pcs", questionId: "q2", topicId: "polity", isCorrect: false, errorType: "concept-confusion" },
  ],
  revisions: [
    { id: "r1", missionId: "pcs", topicId: "polity", dueAt: now - 1000, lastResult: "incorrect", repetitions: 0, intervalDays: 1 },
  ],
  courseNodes: [
    { id: "t1", missionId: "pcs", kind: "topic", name: "Polity", status: "learning" },
  ],
  contentChunks: [
    { id: "chunk-1", missionId: "pcs", text: "Source-backed polity content." },
  ],
  groundedQuestions: [groundedPyq],
  sourceIds,
  chunkIds,
  now,
});

assert.equal(plan.priorities.dueRevisions, 1);
assert.equal(plan.priorities.weakRevisionCards, 1);
assert.equal(plan.priorities.dominantErrorType, "concept-confusion");
assert.equal(plan.priorities.pyqsAvailable, 1);
assert.equal(plan.priorities.pyqAttempts, 0);
assert.equal(plan.priorities.pyqExposure, 0);
assert.equal(plan.plan[0].type, "revision");
assert.ok(plan.plan.some((item) => item.type === "pyq"), "Planner should allocate PYQ exposure when verified PYQs are available.");

console.log("Selection loop v2 validation passed.");
