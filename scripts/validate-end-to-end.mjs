import assert from "node:assert/strict";
import { createContentChunk } from "../src/data/contentModel.js";
import { buildGroundedCourseDraft } from "../src/data/courseGeneration.js";
import { addGroundedQuestion, groundedQuestionsForMission } from "../src/data/mcqBank.js";
import { validateGroundedQuestion } from "../src/data/questionProvenance.js";
import { filterPyqs } from "../src/data/pyqEngine.js";
import { createRevisionCard } from "../src/data/questions.js";
import { scheduleRevision } from "../src/data/revision.js";
import { buildStudyPlan } from "../src/data/planner.js";
import { calculateReadiness } from "../src/data/readiness.js";

const missionId = "pcs";
const sourceId = "audit-source";
const chunkId = "audit-source:1";
const chunks = [createContentChunk({
  id: chunkId,
  sourceId,
  missionId,
  locator: "page:1",
  text: "The audit topic has a documented definition and a 2025 official reference.",
  evidenceLayer: "user-source",
})];

assert.ok(chunks[0]);

const course = buildGroundedCourseDraft({ chunks, missionId, topic: "Audit Topic" });
assert.equal(course.generated, true);
assert.equal(course.content[0].sourceRefs[0], sourceId);
assert.equal(course.content[0].sourceChunkRefs[0], chunkId);

const question = {
  id: "audit-pyq-1",
  missionId,
  subjectId: "gs",
  topicId: "audit-topic",
  questionType: "pyq",
  sourceRefs: [sourceId],
  sourceChunkRefs: [chunkId],
  stem: "Which year is documented in the source?",
  options: [
    { id: "a", text: "2025" },
    { id: "b", text: "2024" },
  ],
  correctOptionId: "a",
  explanation: "The source states 2025.",
  difficulty: "easy",
  pyq: { year: 2025, exam: "Audit Exam", paper: "Paper I" },
  marking: { correct: 1, wrong: 0, unanswered: 0 },
  tags: ["pyq"],
};

assert.equal(validateGroundedQuestion(question, [sourceId], [chunkId]).valid, true);
const bank = addGroundedQuestion([], question, [sourceId], [chunkId]);
assert.equal(groundedQuestionsForMission(bank, missionId, [sourceId], [chunkId]).length, 1);
assert.equal(filterPyqs(bank, { missionId }, [sourceId], [chunkId]).length, 1);

const now = Date.now();
const revision = scheduleRevision(
  createRevisionCard({ missionId, topicId: "audit-topic", sourceRefs: [sourceId], dueAt: now }),
  false
);
assert.equal(revision.lastResult, "incorrect");
assert.equal(revision.repetitions, 0);

const attempts = [{
  id: "audit-attempt-1",
  questionId: question.id,
  missionId,
  subjectId: question.subjectId,
  topicId: question.topicId,
  selectedOptionId: "b",
  isCorrect: false,
  marks: 0,
  attemptedAt: now,
  errorType: "concept-confusion",
}];

const plan = buildStudyPlan({
  missionId,
  availableMinutes: 30,
  sessions: [],
  attempts,
  revisions: [revision],
  courseNodes: [{ id: "audit-topic", missionId, kind: "topic", name: "Audit Topic", status: "not-started" }],
  contentChunks: chunks,
  groundedQuestions: bank,
  sourceIds: [sourceId],
  chunkIds: [chunkId],
  now,
});
assert.ok(plan.plan.some((item) => item.type === "revision" || item.type === "practice"));

const readiness = calculateReadiness({
  sessions: [],
  attempts,
  revisions: [revision],
  courseNodes: [{ id: "audit-topic", missionId, kind: "topic", name: "Audit Topic", status: "not-started" }],
  questions: bank,
  missionId,
  now,
});
assert.equal(readiness.attempts, 1);
assert.equal(readiness.pyqExposure, 100);

console.log("End-to-end selection audit passed: source -> course -> grounded PYQ -> attempt -> revision -> planner -> readiness.");
