import { createGroundedQuestion } from "../src/data/mcqContent.js";
import { validatePyqRecord, filterPyqs, buildPyqTrend, pyqExposure } from "../src/data/pyqEngine.js";
import { applyAttemptToRevision, retentionSignal } from "../src/data/retentionEngine.js";

const question = createGroundedQuestion({
  missionId: "pcs",
  topicId: "polity-parliament",
  questionType: "pyq",
  stem: "Which system is described by the supplied source?",
  options: [{ id: "a", text: "Parliamentary system" }, { id: "b", text: "Presidential system" }],
  correctOptionId: "a",
  explanation: "Source-grounded PYQ record.",
  pyq: { year: 2024, exam: "PCS", paper: "GS" },
  sourceRefs: ["s1"],
  sourceChunkRefs: ["c1"],
  tags: ["pyq"],
});

if (!validatePyqRecord(question, ["s1"], ["c1"]).valid) throw new Error("Valid PYQ record was rejected.");
if (filterPyqs([question], { missionId: "pcs", year: 2024 }, ["s1"], ["c1"]).length !== 1) throw new Error("PYQ filtering failed.");

const trend = buildPyqTrend([question], ["s1"], ["c1"]);
if (trend.total !== 1 || trend.byYear[0].year !== 2024 || trend.byTopic[0].topicId !== "polity-parliament") {
  throw new Error("PYQ trend aggregation failed.");
}

const card = {
  id: "r1",
  missionId: "pcs",
  topicId: "polity-parliament",
  sourceRefs: ["s1"],
  dueAt: Date.now() - 1000,
  intervalDays: 1,
  repetitions: 0,
  lastResult: null,
};
const weak = applyAttemptToRevision(card, { isCorrect: false, errorType: "concept-confusion" });
if (weak.state !== "weak-error" || weak.lastErrorType !== "concept-confusion" || weak.intervalDays !== 1) {
  throw new Error("Incorrect attempt did not create the expected retention signal.");
}
const stable = applyAttemptToRevision(weak, { isCorrect: true });
if (stable.state !== "re-tested") throw new Error("Correct re-test did not advance revision state.");

const signal = retentionSignal([weak, stable]);
if (signal.total !== 2 || signal.weak < 1) throw new Error("Retention summary failed.");

const exposure = pyqExposure(
  [{ missionId: "pcs", questionId: question.id }],
  [question],
  "pcs"
);
if (exposure.attempts !== 1 || exposure.percentage !== 100) throw new Error("PYQ exposure calculation failed.");

console.log("PYQ + retention loop validation passed.");
