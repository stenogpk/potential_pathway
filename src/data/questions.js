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
