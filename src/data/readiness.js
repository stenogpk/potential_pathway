export function calculateReadiness({ sessions = [], attempts = [], revisions = [], courseNodes = [], missionId }) {
  const missionAttempts = attempts.filter((a) => a.missionId === missionId);
  const missionSessions = sessions.filter((s) => s.missionId === missionId);
  const missionRevisions = revisions.filter((r) => r.missionId === missionId);
  const missionTopics = courseNodes.filter((n) => n.missionId === missionId && n.kind === "topic");
  const completedTopics = missionTopics.filter((n) => n.status === "completed").length;
  const correct = missionAttempts.filter((a) => a.isCorrect).length;
  const accuracy = missionAttempts.length ? Math.round(correct / missionAttempts.length * 100) : null;
  return {
    studyMinutes: Math.floor(missionSessions.reduce((sum, s) => sum + (s.actualSeconds || 0), 0) / 60),
    attempts: missionAttempts.length,
    accuracy,
    revisionDue: missionRevisions.filter((r) => r.dueAt <= Date.now()).length,
    completedTopics,
    totalTopics: missionTopics.length,
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
