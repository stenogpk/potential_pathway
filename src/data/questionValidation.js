export function validateQuestionProvenance(question, sourceIds = []) {
  if (!question?.id || !question?.missionId || !question?.stem) return { valid: false, reason: "Question identity/content is incomplete." };
  if (!Array.isArray(question.sourceRefs) || !question.sourceRefs.length) return { valid: false, reason: "Question has no source reference." };
  const allowed = new Set(sourceIds);
  const unknown = question.sourceRefs.filter((id) => !allowed.has(id));
  if (unknown.length) return { valid: false, reason: "Question references an unknown source." };
  return { valid: true, reason: "" };
}

export function filterSourceGroundedQuestions(questions, sourceIds) {
  return (Array.isArray(questions) ? questions : []).filter((question) =>
    validateQuestionProvenance(question, sourceIds).valid
  );
}
