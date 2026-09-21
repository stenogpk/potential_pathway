export const questionTypes = [
  "concept",
  "fact",
  "application",
  "pyq",
];

export const groundedQuestionSchema = {
  id: "string",
  missionId: "string",
  subjectId: "string",
  topicId: "string",
  questionType: "concept | fact | application | pyq",
  sourceRefs: [],
  sourceChunkRefs: [],
  evidenceLayers: [],
  sourceUrls: [],
  stem: "",
  options: [],
  correctOptionId: "",
  explanation: "",
  difficulty: "easy | medium | hard",
  pyq: {
    year: null,
    exam: "",
    paper: "",
  },
  marking: {
    correct: 1,
    wrong: 0,
    unanswered: 0,
  },
  errorLink: {
    attemptId: null,
    revisionId: null,
    errorType: null,
  },
  tags: [],
};

export function createGroundedQuestion({
  missionId,
  subjectId = "",
  topicId = "",
  questionType = "concept",
  stem,
  options = [],
  correctOptionId,
  explanation,
  difficulty = "medium",
  pyq = {},
  marking = {},
  errorLink = {},
  sourceRefs = [],
  sourceChunkRefs = [],
  evidenceLayers = [],
  sourceUrls = [],
  tags = [],
}) {
  if (!missionId || !topicId || !String(stem || "").trim()) return null;
  if (!questionTypes.includes(questionType)) return null;
  if (!Array.isArray(options) || options.length < 2 || !correctOptionId) return null;

  const normalizedPyq = {
    year: Number.isInteger(pyq.year) ? pyq.year : null,
    exam: String(pyq.exam || ""),
    paper: String(pyq.paper || ""),
  };

  if (questionType === "pyq" && !normalizedPyq.year) return null;

  return {
    id: crypto.randomUUID(),
    missionId,
    subjectId,
    topicId,
    questionType,
    sourceRefs: [...new Set(sourceRefs)],
    sourceChunkRefs: [...new Set(sourceChunkRefs)],
    evidenceLayers: [...new Set(evidenceLayers)],
    sourceUrls: [...new Set(sourceUrls)],
    stem: String(stem).trim(),
    options,
    correctOptionId,
    explanation: String(explanation || "").trim(),
    difficulty,
    pyq: normalizedPyq,
    marking: {
      correct: Number.isFinite(marking.correct) ? marking.correct : 1,
      wrong: Number.isFinite(marking.wrong) ? marking.wrong : 0,
      unanswered: Number.isFinite(marking.unanswered) ? marking.unanswered : 0,
    },
    errorLink: {
      attemptId: errorLink.attemptId || null,
      revisionId: errorLink.revisionId || null,
      errorType: errorLink.errorType || null,
    },
    tags: [...new Set(tags)],
  };
}
