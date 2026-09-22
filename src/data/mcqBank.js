import { filterGroundedQuestions } from "./questionProvenance.js";
import { admitAuthoredQuestion } from "./questionAuthoring.js";

export function addGroundedQuestion(questions, question, sourceIds, chunkIds) {
  const result = admitAuthoredQuestion(questions, question, {
    sourceIds,
    chunkIds,
  });
  return result.questions;
}

export function validateAndAdmitGroundedQuestion(questions, question, sourceIds, chunkIds) {
  return admitAuthoredQuestion(questions, question, {
    sourceIds,
    chunkIds,
  });
}

export function groundedQuestionsForMission(questions, missionId, sourceIds, chunkIds) {
  return filterGroundedQuestions(questions, sourceIds, chunkIds)
    .filter((question) => question.missionId === missionId);
}
