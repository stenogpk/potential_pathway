export const revisionIntervals = [1, 3, 7, 14, 30];

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

export function getDueRevisions(revisions, now = Date.now()) {
  return revisions.filter((r) => r.dueAt <= now);
}

export function revisionSummary(revisions, now = Date.now()) {
  const due = getDueRevisions(revisions, now);
  return {
    total: revisions.length,
    due: due.length,
    overdue: due.filter((r) => r.dueAt < now - 24 * 60 * 60 * 1000).length,
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
    nextDueAt: nextDueRevision(revisions, now)?.dueAt || null,
  };
}
