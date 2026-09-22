import { validateGroundedQuestion } from "./questionProvenance.js";

export function normalizeAuthoredQuestion(question = {}) {
  return {
    ...question,
    stem: String(question.stem || "").trim(),
    explanation: String(question.explanation || "").trim(),
    options: Array.isArray(question.options)
      ? question.options.map((option) => ({ ...option, id: String(option.id || "").trim(), text: String(option.text || "").trim() }))
      : [],
    sourceRefs: Array.isArray(question.sourceRefs) ? [...new Set(question.sourceRefs)] : [],
    sourceChunkRefs: Array.isArray(question.sourceChunkRefs) ? [...new Set(question.sourceChunkRefs)] : [],
  };
}

export function questionFingerprint(question = {}) {
  return normalizeAuthoredQuestion(question).stem
    .toLowerCase()
    .replace(/\\s+/g, " ")
    .replace(/[^a-z0-9\\u0900-\\u097f ]/gi, "")
    .trim();
}

export function findDuplicateQuestion(questions = [], candidate = {}) {
  const fingerprint = questionFingerprint(candidate);
  if (!fingerprint) return null;
  return questions.find((question) => questionFingerprint(question) === fingerprint) || null;
}

export function validateAuthoredQuestion(question, { sourceIds = [], chunkIds = [], existingQuestions = [] } = {}) {
  const normalized = normalizeAuthoredQuestion(question);
  const provenance = validateGroundedQuestion(normalized, sourceIds, chunkIds);
  if (!provenance.valid) return { valid: false, reason: provenance.reason, question: normalized };
  if (!normalized.explanation) return { valid: false, reason: "A source-grounded explanation is required.", question: normalized };
  if (normalized.options.some((option) => !option.id || !option.text)) {
    return { valid: false, reason: "Every option needs an id and text.", question: normalized };
  }
  const duplicate = findDuplicateQuestion(existingQuestions, normalized);
  if (duplicate && duplicate.id !== normalized.id) {
    return { valid: false, reason: "A question with the same stem already exists.", duplicateId: duplicate.id, question: normalized };
  }
  return { valid: true, reason: "", question: normalized };
}

export function admitAuthoredQuestion(questions, question, context = {}) {
  const result = validateAuthoredQuestion(question, { ...context, existingQuestions: questions });
  if (!result.valid) return { questions: Array.isArray(questions) ? questions : [], ...result };
  return {
    questions: [result.question, ...(Array.isArray(questions) ? questions : []).filter((item) => item.id !== result.question.id)],
    ...result,
  };
}
