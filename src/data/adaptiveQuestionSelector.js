import { getRevisionState } from "./revision.js";

export function selectNextQuestion(questions = [], { index = 0, attempts = [], revisions = [], now = Date.now() } = {}) {
  if (!questions.length) return null;
  const attempted = new Map();
  attempts.forEach((attempt) => attempted.set(attempt.questionId, attempt));
  const revisionByTopic = new Map();
  revisions.forEach((card) => revisionByTopic.set(card.topicId, getRevisionState(card, now)));
  const scored = questions.map((question, position) => {
    const last = attempted.get(question.id);
    let score = 0;
    if (!last) score += 20;
    if (last && !last.isCorrect) score += 40;
    const state = revisionByTopic.get(question.topicId);
    if (state === "weak-error") score += 30;
    if (question.questionType === "pyq") score += 10;
    score += Math.max(0, 10 - ((position - index + questions.length) % questions.length));
    return { question, score, position };
  });
  scored.sort((a,b)=>b.score-a.score || a.position-b.position);
  return scored[0].question;
}
