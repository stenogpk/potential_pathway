export const revisionIntervals = [1, 3, 7, 14, 30];

export const revisionStates = [
  "new",
  "due",
  "weak-error",
  "re-tested",
  "stable",
  "mastered",
];

export const MASTERED_REPETITIONS = 5;
export const STABLE_REPETITIONS = 3;

export function getRevisionState(card = {}, now = Date.now()) {
  if (!card.lastResult && !(card.repetitions > 0)) return "new";
  if (card.lastResult === "incorrect") return "weak-error";
  if (card.dueAt && card.dueAt <= now) return "due";
  if (card.repetitions >= MASTERED_REPETITIONS) return "mastered";
  if (card.repetitions >= STABLE_REPETITIONS) return "stable";
  if (card.repetitions > 0) return "re-tested";
  return "new";
}

export function scheduleRevision(card, isCorrect) {
  const repetitions = isCorrect ? (card.repetitions || 0) + 1 : 0;
  const index = Math.min(repetitions, revisionIntervals.length - 1);
  const intervalDays = isCorrect ? revisionIntervals[index] : 1;
  return {
    ...card,
    repetitions,
    intervalDays,
    dueAt: Date.now() + intervalDays * 24 * 60 * 60 * 1000,
    lastResult: isCorrect ? "correct" : "incorrect",
  };
}

export function applyRevisionResult(card, isCorrect, now = Date.now()) {
  const next = scheduleRevision(card, isCorrect);
  return {
    ...next,
    state: getRevisionState({ ...next, dueAt: now + next.intervalDays * 24 * 60 * 60 * 1000 }, now),
    reviewedAt: now,
  };
}

export function getDueRevisions(revisions, now = Date.now()) {
  return revisions.filter((r) => r.dueAt <= now);
}

export function revisionSummary(revisions, now = Date.now()) {
  const due = getDueRevisions(revisions, now);
  return {
    total: revisions.length,
    due: due.length,
    overdue: due.filter((r) => r.dueAt < now - 24 * 60 * 60 * 1000).length,
    weak: revisions.filter((r) => getRevisionState(r, now) === "weak-error").length,
    stable: revisions.filter((r) => getRevisionState(r, now) === "stable").length,
    mastered: revisions.filter((r) => getRevisionState(r, now) === "mastered").length,
  };
}

export function nextDueRevision(revisions, now = Date.now()) {
  return [...revisions].filter((r) => r.dueAt > now).sort((a, b) => a.dueAt - b.dueAt)[0] || null;
}

export function revisionLoad(revisions, now = Date.now()) {
  const due = getDueRevisions(revisions, now);
  const overdue = due.filter((r) => r.dueAt < now - 24 * 60 * 60 * 1000).length;
  return {
    due: due.length,
    overdue,
    weak: revisions.filter((r) => getRevisionState(r, now) === "weak-error").length,
    nextDueAt: nextDueRevision(revisions, now)?.dueAt || null,
  };
}
