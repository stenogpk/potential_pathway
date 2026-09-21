import { validateGroundedQuestion } from "./questionProvenance.js";

export const PYQ_REQUIRED_FIELDS = ["year", "exam", "paper"];

export function normalizePyqMetadata(pyq = {}) {
  return {
    year: Number.isInteger(pyq.year) ? pyq.year : null,
    exam: String(pyq.exam || "").trim(),
    paper: String(pyq.paper || "").trim(),
  };
}

export function validatePyqRecord(question, sourceIds = [], chunkIds = []) {
  const metadata = normalizePyqMetadata(question?.pyq);
  if (question?.questionType !== "pyq") return { valid: false, reason: "Question is not marked as PYQ." };
  if (!metadata.year || !metadata.exam || !metadata.paper) {
    return { valid: false, reason: "PYQ requires year, exam and paper metadata." };
  }
  const provenance = validateGroundedQuestion(question, sourceIds, chunkIds);
  if (!provenance.valid) return provenance;
  return { valid: true, metadata };
}

export function filterPyqs(questions = [], { missionId, topicId = null, year = null, exam = null } = {}, sourceIds = [], chunkIds = []) {
  return questions.filter((question) => {
    if (question.questionType !== "pyq") return false;
    if (missionId && question.missionId !== missionId) return false;
    if (topicId && question.topicId !== topicId) return false;
    if (year && question.pyq?.year !== year) return false;
    if (exam && String(question.pyq?.exam || "").toLowerCase() !== String(exam).toLowerCase()) return false;
    return validatePyqRecord(question, sourceIds, chunkIds).valid;
  });
}

export function buildPyqTrend(questions = [], sourceIds = [], chunkIds = []) {
  const valid = filterPyqs(questions, {}, sourceIds, chunkIds);
  const byYear = new Map();
  const byTopic = new Map();

  valid.forEach((question) => {
    const year = question.pyq.year;
    byYear.set(year, (byYear.get(year) || 0) + 1);
    byTopic.set(question.topicId, (byTopic.get(question.topicId) || 0) + 1);
  });

  return {
    total: valid.length,
    byYear: [...byYear.entries()].sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, count })),
    byTopic: [...byTopic.entries()].sort((a, b) => b[1] - a[1]).map(([topicId, count]) => ({ topicId, count })),
  };
}

export function pyqExposure(attempts = [], questions = [], missionId) {
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const missionAttempts = attempts.filter((attempt) => attempt.missionId === missionId);
  const pyqAttempts = missionAttempts.filter((attempt) => questionById.get(attempt.questionId)?.questionType === "pyq");
  return {
    attempts: pyqAttempts.length,
    percentage: missionAttempts.length ? Math.round((pyqAttempts.length / missionAttempts.length) * 100) : null,
  };
}
