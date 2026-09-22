import { getRevisionState, scheduleRevision } from "./revision.js";

export const RETENTION_ERROR_TYPES = [
  "knowledge-gap","concept-confusion","fact-recall","application-error","careless-error",
];

export function classifyAttemptError({ isCorrect, errorType = null } = {}) {
  if (isCorrect) return null;
  return RETENTION_ERROR_TYPES.includes(errorType) ? errorType : "knowledge-gap";
}

export function applyAttemptToRevision(card, { isCorrect, errorType = null, now = Date.now() } = {}) {
  if (!card) return null;
  const next = scheduleRevision(card, isCorrect);
  return {
    ...next,
    lastErrorType: classifyAttemptError({ isCorrect, errorType }),
    reviewedAt: now,
    state: getRevisionState({ ...next, dueAt: now + next.intervalDays * 86400000 }, now),
  };
}

export function retentionSignal(revisions = [], now = Date.now()) {
  const states = revisions.map((card) => getRevisionState(card, now));
  const mastered = states.filter((state) => state === "mastered").length;
  const stable = states.filter((state) => state === "stable").length;
  const weak = states.filter((state) => state === "weak-error").length;
  const due = states.filter((state) => state === "due").length;
  return { total: revisions.length, mastered, stable, weak, due, retained: mastered + stable,
    retentionPercent: revisions.length ? Math.round(((mastered + stable * 0.75) / revisions.length) * 100) : null };
}
