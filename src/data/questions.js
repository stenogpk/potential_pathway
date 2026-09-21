export const questionTypes = ["concept", "fact", "application", "pyq"];

export const questionSchema = {
  id: "string",
  missionId: "string",
  subjectId: "string",
  topicId: "string",
  questionType: "concept | fact | application | pyq",
  sourceRefs: [],
  stem: "",
  options: [],
  correctOptionId: "",
  explanation: "",
  difficulty: "easy | medium | hard",
  pyq: { year: null, exam: "", paper: "" },
  marking: { correct: 1, wrong: 0, unanswered: 0 },
  tags: [],
};

export const attemptSchema = {
  id: "string",
  questionId: "string",
  missionId: "string",
  subjectId: "string",
  topicId: "string",
  selectedOptionId: null,
  isCorrect: false,
  isUnanswered: false,
  marks: 0,
  timeSeconds: 0,
  attemptedAt: 0,
  errorType: null,
  revisionId: null,
};

export const missionMarking = {
  pcs: null,
  chemistry: { correct: 3, wrong: -1, unanswered: 0 },
};

export function getMissionMarking(missionId) {
  return missionMarking[missionId] || { correct: 1, wrong: 0, unanswered: 0 };
}

export function getQuestionMarking(question, missionId) {
  const mission = getMissionMarking(missionId);
  return {
    correct: Number.isFinite(question?.marking?.correct) ? question.marking.correct : mission.correct,
    wrong: Number.isFinite(question?.marking?.wrong) ? question.marking.wrong : mission.wrong,
    unanswered: Number.isFinite(question?.marking?.unanswered) ? question.marking.unanswered : mission.unanswered,
  };
}

export function calculateMarks(isCorrect, marking = { correct: 1, wrong: 0 }, isUnanswered = false) {
  if (isUnanswered) return marking.unanswered ?? 0;
  return isCorrect ? marking.correct : marking.wrong;
}

export function scoreQuestionAttempt(question, selectedOptionId) {
  const marking = getQuestionMarking(question, question?.missionId);
  const isUnanswered = !selectedOptionId;
  const isCorrect = !isUnanswered && selectedOptionId === question.correctOptionId;
  return {
    isCorrect,
    isUnanswered,
    marks: calculateMarks(isCorrect, marking, isUnanswered),
  };
}

export function createAttemptRecord({
  question,
  selectedOptionId = null,
  timeSeconds = 0,
  revisionId = null,
  errorType = null,
  attemptedAt = Date.now(),
}) {
  if (!question?.id) return null;
  const result = scoreQuestionAttempt(question, selectedOptionId);
  return {
    id: crypto.randomUUID(),
    questionId: question.id,
    missionId: question.missionId,
    subjectId: question.subjectId || "",
    topicId: question.topicId,
    selectedOptionId,
    ...result,
    timeSeconds,
    attemptedAt,
    errorType: result.isCorrect ? null : errorType || "knowledge-gap",
    revisionId,
  };
}

export function createRevisionCard({ missionId, topicId, sourceRefs = [], dueAt = Date.now(), intervalDays = 1, lastResult = null }) {
  return {
    id: crypto.randomUUID(),
    missionId,
    topicId,
    sourceRefs,
    dueAt,
    intervalDays,
    ease: 2.5,
    repetitions: 0,
    lastResult,
    createdAt: Date.now(),
  };
}

export function nextRevision(card, isCorrect) {
  const interval = isCorrect
    ? Math.max(1, Math.round(card.intervalDays * (card.repetitions ? 2.5 : 2)))
    : 1;
  return {
    ...card,
    dueAt: Date.now() + interval * 24 * 60 * 60 * 1000,
    intervalDays: interval,
    repetitions: isCorrect ? card.repetitions + 1 : 0,
    lastResult: isCorrect ? "correct" : "incorrect",
  };
}

export const revisionSchema = {
  id: "string",
  missionId: "string",
  topicId: "string",
  sourceRefs: [],
  dueAt: 0,
  intervalDays: 0,
  ease: 2.5,
  repetitions: 0,
  lastResult: null,
};

export const questionBank = [
  {
    id: "pp-demo-1",
    missionId: "pcs",
    subjectId: "pp",
    topicId: "readiness",
    sourceRefs: [],
    stem: "Which cycle is the PP readiness loop built around?",
    options: [
      { id: "a", text: "Learn → Practice → Revise → Analyse → Retain" },
      { id: "b", text: "Read → Memorise → Stop" },
      { id: "c", text: "Only MCQs" },
      { id: "d", text: "Only video lectures" },
    ],
    correctOptionId: "a",
    explanation: "This is the product's intended preparation loop.",
    difficulty: "easy",
    tags: ["product-demo"],
  },
  {
    id: "pp-demo-2",
    missionId: "pcs",
    subjectId: "pp",
    topicId: "sources",
    sourceRefs: [],
    stem: "Where should detailed mission content come from?",
    options: [
      { id: "a", text: "Random web summaries" },
      { id: "b", text: "Source-grounded official/reference material" },
      { id: "c", text: "Unverified notes only" },
      { id: "d", text: "Generated content without sources" },
    ],
    correctOptionId: "b",
    explanation: "PP should ground course content in supplied authoritative sources.",
    difficulty: "easy",
    tags: ["product-demo"],
  },
];

export function questionsForMission(questions, missionId) {
  return questions.filter((question) => question.missionId === missionId);
}

export function questionsForTopic(questions, topicId) {
  return questions.filter((question) => question.topicId === topicId);
}

export function attemptSummary(attempts, missionId = null) {
  const rows = missionId ? attempts.filter((attempt) => attempt.missionId === missionId) : attempts;
  const correct = rows.filter((attempt) => attempt.isCorrect).length;
  return {
    attempts: rows.length,
    correct,
    accuracy: rows.length ? Math.round((correct / rows.length) * 100) : null,
    marks: rows.reduce((sum, attempt) => sum + (attempt.marks || 0), 0),
  };
}
