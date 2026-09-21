export const questionSchema = {
  id: "string",
  missionId: "string",
  subjectId: "string",
  topicId: "string",
  sourceRefs: [],
  stem: "",
  options: [],
  correctOptionId: "",
  explanation: "",
  difficulty: "easy | medium | hard",
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
  marks: 0,
  timeSeconds: 0,
  attemptedAt: 0,
};

export const missionMarking = {
  pcs: null,
  chemistry: { correct: 3, wrong: -1 },
};

export function calculateMarks(isCorrect, marking = { correct: 1, wrong: 0 }) {
  return isCorrect ? marking.correct : marking.wrong;
}

export function getMissionMarking(missionId) {
  return missionMarking[missionId] || { correct: 1, wrong: 0 };
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
