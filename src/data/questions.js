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
  selectedOptionId: null,
  isCorrect: false,
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
