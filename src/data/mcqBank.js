import { filterGroundedQuestions } from "./questionProvenance.js";

export function addGroundedQuestion(questions, question, sourceIds, chunkIds) {
  const valid = filterGroundedQuestions([question], sourceIds, chunkIds);
  if (!valid.length) return Array.isArray(questions) ? questions : [];
  return [valid[0], ...(Array.isArray(questions) ? questions : []).filter((item) => item.id !== valid[0].id)];
}

export function groundedQuestionsForMission(questions, missionId, sourceIds, chunkIds) {
  return filterGroundedQuestions(questions, sourceIds, chunkIds)
    .filter((question) => question.missionId === missionId);
}
