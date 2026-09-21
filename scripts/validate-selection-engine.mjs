import { getRevisionState, revisionSummary } from "../src/data/revision.js";
import { calculateReadiness } from "../src/data/readiness.js";
import { buildStudyPlan } from "../src/data/planner.js";

const now = Date.now();
const card = { id: "r1", missionId: "pcs", dueAt: now - 1000, repetitions: 0, lastResult: null };
if (getRevisionState(card, now) !== "due") throw new Error("Due revision state failed.");
const fresh = { id: "r0", missionId: "pcs", dueAt: now + 86400000, repetitions: 0, lastResult: null };
if (getRevisionState(fresh, now) !== "new") throw new Error("New revision state failed.");

const weak = { ...card, lastResult: "incorrect" };
if (getRevisionState(weak, now) !== "weak-error") throw new Error("Weak/error revision state failed.");

const mastered = { ...card, dueAt: now + 86400000, repetitions: 5, lastResult: "correct" };
if (getRevisionState(mastered, now) !== "mastered") throw new Error("Mastered revision state failed.");

const summary = revisionSummary([card, weak, mastered], now);
if (summary.due !== 2 || summary.weak !== 1 || summary.mastered !== 1) {
  throw new Error("Revision summary state counts failed.");
}

const readiness = calculateReadiness({
  missionId: "pcs",
  now,
  sessions: [{ missionId: "pcs", actualSeconds: 3600 }],
  attempts: [
    { missionId: "pcs", questionId: "q1", topicId: "t1", isCorrect: true },
    { missionId: "pcs", questionId: "q2", topicId: "t1", isCorrect: false },
  ],
  questions: [
    { id: "q1", type: "pyq" },
    { id: "q2", tags: [] },
  ],
  revisions: [mastered],
  courseNodes: [
    { missionId: "pcs", kind: "topic", status: "completed" },
    { missionId: "pcs", kind: "topic", status: "learning" },
  ],
  examDate: new Date(now + 10 * 86400000).toISOString(),
});
if (readiness.coverage !== 50 || readiness.accuracy !== 50 || readiness.pyqExposure !== 50 || readiness.examCountdownDays !== 10) {
  throw new Error("Readiness metrics failed.");
}

const plan = buildStudyPlan({
  missionId: "pcs",
  availableMinutes: 30,
  now,
  attempts: [],
  revisions: [card],
  courseNodes: [{ missionId: "pcs", kind: "topic", name: "Polity", status: "learning" }],
  contentChunks: [{ missionId: "pcs", text: "source-backed" }],
});
if (!plan.plan.length || plan.plan[0].type !== "revision") {
  throw new Error("Adaptive planner did not prioritize due revision.");
}

console.log("Selection engine v1 validation passed.");
