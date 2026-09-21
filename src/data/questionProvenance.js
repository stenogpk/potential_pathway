export function validateGroundedQuestion(question, sourceIds = [], chunkIds = []) {
  if (!question?.id || !question?.missionId || !question?.topicId || !String(question.stem || "").trim()) {
    return { valid: false, reason: "Question identity, topic or stem is incomplete." };
  }
  if (!Array.isArray(question.options) || question.options.length < 2 || !question.correctOptionId) {
    return { valid: false, reason: "Question options or correct answer is incomplete." };
  }
  if (!question.options.some((option) => option.id === question.correctOptionId)) {
    return { valid: false, reason: "Correct option does not exist in the option list." };
  }
  if (!Array.isArray(question.sourceRefs) || question.sourceRefs.length === 0) {
    return { valid: false, reason: "Question has no source reference." };
  }

  const allowedSources = new Set(sourceIds);
  if (question.sourceRefs.some((id) => !allowedSources.has(id))) {
    return { valid: false, reason: "Question references an unknown source." };
  }

  const allowedChunks = new Set(chunkIds);
  if (!Array.isArray(question.sourceChunkRefs) || question.sourceChunkRefs.length === 0) {
    return { valid: false, reason: "Question has no source-chunk reference." };
  }
  if (question.sourceChunkRefs.some((id) => !allowedChunks.has(id))) {
    return { valid: false, reason: "Question references an unknown source chunk." };
  }

  return { valid: true, reason: "" };
}

export function filterGroundedQuestions(questions, sourceIds, chunkIds) {
  return (Array.isArray(questions) ? questions : []).filter((question) =>
    validateGroundedQuestion(question, sourceIds, chunkIds).valid
  );
}
