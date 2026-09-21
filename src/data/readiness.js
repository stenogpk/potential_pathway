import { getRevisionState } from "./revision.js";

function percentage(value, total) {
  return total ? Math.round((value / total) * 100) : null;
}

function examCountdownDays(examDate, now = Date.now()) {
  if (!examDate) return null;
  const target = new Date(examDate).getTime();
  if (!Number.isFinite(target)) return null;
  return Math.max(0, Math.ceil((target - now) / (24 * 60 * 60 * 1000)));
}

export function calculateReadiness({
  sessions = [],
  attempts = [],
  revisions = [],
  courseNodes = [],
  questions = [],
  missionId,
  examDate = null,
  now = Date.now(),
}) {
  const missionAttempts = attempts.filter((a) => a.missionId === missionId);
  const missionSessions = sessions.filter((s) => s.missionId === missionId);
  const missionRevisions = revisions.filter((r) => r.missionId === missionId);
  const missionTopics = courseNodes.filter((n) => n.missionId === missionId && n.kind === "topic");
  const completedTopics = missionTopics.filter((n) => n.status === "completed").length;
  const correct = missionAttempts.filter((a) => a.isCorrect).length;
  const accuracy = percentage(correct, missionAttempts.length);

  const questionById = new Map(questions.filter(Boolean).map((q) => [q.id, q]));
  const attemptedQuestions = missionAttempts.map((a) => questionById.get(a.questionId)).filter(Boolean);
  const pyqAttempts = attemptedQuestions.filter((q) =>
    q.type === "pyq" || q.questionType === "pyq" || q.tags?.includes("pyq")
  ).length;

  const due = missionRevisions.filter((r) => r.dueAt <= now).length;
  const mastered = missionRevisions.filter((r) => getRevisionState(r, now) === "mastered").length;
  const stable = missionRevisions.filter((r) => getRevisionState(r, now) === "stable").length;
  const retention = missionRevisions.length
    ? Math.round(((mastered + stable * 0.75) / missionRevisions.length) * 100)
    : null;

  const coverage = percentage(completedTopics, missionTopics.length);
  const pyqExposure = percentage(pyqAttempts, missionAttempts.length);
  const revisionControl = missionRevisions.length ? percentage(missionRevisions.length - due, missionRevisions.length) : null;

  const components = [coverage, accuracy, revisionControl, retention, pyqExposure].filter((v) => v !== null);
  const readinessScore = components.length
    ? Math.round(components.reduce((sum, value) => sum + value, 0) / components.length)
    : null;

  return {
    studyMinutes: Math.floor(missionSessions.reduce((sum, s) => sum + (s.actualSeconds || 0), 0) / 60),
    attempts: missionAttempts.length,
    accuracy,
    revisionDue: due,
    completedTopics,
    totalTopics: missionTopics.length,
    coverage,
    revisionControl,
    retention,
    pyqExposure,
    readinessScore,
    examCountdownDays: examCountdownDays(examDate, now),
  };
}

export function topicAccuracy(attempts, missionId) {
  const rows = attempts.filter((attempt) => attempt.missionId === missionId);
  const byTopic = new Map();
  rows.forEach((attempt) => {
    const current = byTopic.get(attempt.topicId) || { attempts: 0, correct: 0 };
    current.attempts += 1;
    if (attempt.isCorrect) current.correct += 1;
    byTopic.set(attempt.topicId, current);
  });
  return [...byTopic.entries()].map(([topicId, value]) => ({
    topicId,
    ...value,
    accuracy: value.attempts ? Math.round((value.correct / value.attempts) * 100) : null,
  }));
}

export function weakestTopics(attempts, missionId, limit = 5) {
  return topicAccuracy(attempts, missionId)
    .filter((row) => row.attempts >= 2)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
    .slice(0, limit);
}
