export const groundedQuestionSchema = {
  id: "string",
  missionId: "string",
  subjectId: "string",
  topicId: "string",
  sourceRefs: [],
  sourceChunkRefs: [],
  evidenceLayers: [],
  sourceUrls: [],
  stem: "",
  options: [],
  correctOptionId: "",
  explanation: "",
  difficulty: "easy | medium | hard",
  tags: [],
};

export function createGroundedQuestion({
  missionId,
  subjectId = "",
  topicId = "",
  stem,
  options = [],
  correctOptionId,
  explanation,
  difficulty = "medium",
  sourceRefs = [],
  sourceChunkRefs = [],
  evidenceLayers = [],
  sourceUrls = [],
  tags = [],
}) {
  if (!missionId || !topicId || !String(stem || "").trim()) return null;
  if (!Array.isArray(options) || options.length < 2 || !correctOptionId) return null;
  return {
    id: crypto.randomUUID(),
    missionId,
    subjectId,
    topicId,
    sourceRefs: [...new Set(sourceRefs)],
    sourceChunkRefs: [...new Set(sourceChunkRefs)],
    evidenceLayers: [...new Set(evidenceLayers)],
    sourceUrls: [...new Set(sourceUrls)],
    stem: String(stem).trim(),
    options,
    correctOptionId,
    explanation: String(explanation || "").trim(),
    difficulty,
    tags: [...new Set(tags)],
  };
}
