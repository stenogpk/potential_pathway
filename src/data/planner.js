import { getRevisionState } from "./revision.js";
import { filterPyqs } from "./pyqEngine.js";

function daysUntil(examDate, now = Date.now()) {
  if (!examDate) return null;
  const time = new Date(examDate).getTime();
  return Number.isFinite(time) ? Math.max(0, Math.ceil((time - now) / 86400000)) : null;
}

function topicStats(attempts, missionId) {
  const stats = new Map();
  attempts.filter((a) => a.missionId === missionId).forEach((a) => {
    const row = stats.get(a.topicId) || { attempts: 0, correct: 0 };
    row.attempts += 1;
    if (a.isCorrect) row.correct += 1;
    stats.set(a.topicId, row);
  });
  return stats;
}

export function buildStudyPlan({
  missionId,
  availableMinutes = 50,
  sessions = [],
  attempts = [],
  revisions = [],
  courseNodes = [],
  contentChunks = [],
  groundedQuestions = [],
  sourceIds = [],
  chunkIds = [],
  examDate = null,
  now = Date.now(),
}) {
  const missionRevisions = revisions.filter((r) => r.missionId === missionId);
  const due = missionRevisions.filter((r) => r.dueAt <= now);
  const weakRevisions = missionRevisions.filter((r) => getRevisionState(r, now) === "weak-error");
  const stats = topicStats(attempts, missionId);
  const unfinished = courseNodes.filter(
    (n) => n.missionId === missionId && n.kind === "topic" && n.status !== "completed"
  );
  const hasSourceContent = contentChunks.some((chunk) => chunk.missionId === missionId && String(chunk.text || "").trim());
  const countdown = daysUntil(examDate, now);
  const missionQuestions = groundedQuestions.filter((question) => question.missionId === missionId);
  const validPyqs = filterPyqs(missionQuestions, { missionId }, sourceIds, chunkIds);
  const pyqIds = new Set(validPyqs.map((question) => question.id));
  const pyqAttempts = attempts.filter((attempt) => pyqIds.has(attempt.questionId)).length;
  const pyqExposure = attempts.filter((attempt) => attempt.missionId === missionId).length
    ? Math.round((pyqAttempts / attempts.filter((attempt) => attempt.missionId === missionId).length) * 100)
    : null;
  const errorTypes = new Map();
  attempts.filter((attempt) => attempt.missionId === missionId && !attempt.isCorrect).forEach((attempt) => {
    const type = attempt.errorType || "knowledge-gap";
    errorTypes.set(type, (errorTypes.get(type) || 0) + 1);
  });
  const weakTopics = [...stats.entries()]
    .map(([topicId, row]) => ({
      topicId,
      accuracy: row.attempts ? Math.round((row.correct / row.attempts) * 100) : 0,
      attempts: row.attempts,
    }))
    .filter((row) => row.attempts >= 2)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts);
  const hasUnexposedPyq = validPyqs.length > 0 && pyqExposure !== 100;
  const dominantErrorType = [...errorTypes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const candidates = [
    {
      type: "revision",
      priority: due.length * 10 + weakRevisions.length * 2,
      label: due.length ? `Review ${due.length} due revision card${due.length > 1 ? "s" : ""}` : "",
    },
    {
      type: "practice",
      priority: weakRevisions.length * 4 + weakTopics.length * 3,
      label: weakRevisions.length
        ? "Re-test weak/error revision topics"
        : weakTopics[0]
          ? `Re-test weak topic: ${weakTopics[0].topicId}`
          : "",
    },
    {
      type: "pyq",
      priority: hasUnexposedPyq ? 8 : 0,
      label: hasUnexposedPyq ? "Add source-grounded PYQ exposure" : "",
    },
    {
      type: "practice",
      priority: [...stats.values()].length
        ? Math.max(...[...stats.values()].map((row) => row.attempts >= 2 ? 100 - Math.round(row.correct / row.attempts * 100) : 0))
        : 0,
      label: "",
    },
    {
      type: "course",
      priority: unfinished.length * (countdown !== null && countdown <= 60 ? 3 : 2),
      label: unfinished[0] ? (hasSourceContent ? `Study source-backed topic: ${unfinished[0].name}` : `Study next topic: ${unfinished[0].name}`) : "",
    },
    {
      type: "practice",
      priority: 1,
      label: dominantErrorType ? `Target ${dominantErrorType} errors with focused MCQs` : "Finish with focused MCQ practice",
    },
  ].filter((item) => item.label);

  if (countdown !== null && countdown <= 30) {
    candidates.forEach((item) => {
      if (item.type === "revision" || item.type === "practice") item.priority += 5;
    });
  }

  candidates.sort((a, b) => b.priority - a.priority);
  const plan = [];
  let remaining = Math.max(10, availableMinutes);

  for (const item of candidates) {
    if (remaining <= 0) break;
    const minutes = item.type === "revision"
      ? Math.min(10, remaining)
      : item.type === "practice"
        ? Math.min(15, remaining)
        : Math.min(25, remaining);
    plan.push({ type: item.type, minutes, label: item.label });
    remaining -= minutes;
  }

  if (remaining > 0) {
    plan.push({
      type: "practice",
      minutes: remaining,
      label: countdown !== null && countdown <= 30
        ? "Exam-focused mixed MCQ practice"
        : "Finish with focused MCQ practice",
    });
  }

  return {
    missionId,
    availableMinutes,
    examCountdownDays: countdown,
    priorities: {
      dueRevisions: due.length,
      weakRevisionCards: weakRevisions.length,
      weakTopics: weakTopics.slice(0, 3),
      dominantErrorType,
      unfinishedTopics: unfinished.length,
      sourceBackedContent: hasSourceContent,
      pyqsAvailable: validPyqs.length,
      pyqAttempts,
      pyqExposure,
    },
    plan,
  };
}
