import { buildSourceGrounding, canGenerateGroundedQuestion } from "./questionGenerationGate.js";

export function questionGenerationGate({ chunks, missionId, topic }) {
  return buildSourceGrounding({ chunks, missionId, topic });
}

export function canGenerateQuestionFromSources({ chunks, missionId, topic }) {
  return canGenerateGroundedQuestion(questionGenerationGate({ chunks, missionId, topic }));
}
