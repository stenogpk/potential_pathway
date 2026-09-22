import { admitAuthoredQuestion, validateAuthoredQuestion } from "../src/data/questionAuthoring.js";

const sourceIds = ["source-1"];
const chunkIds = ["chunk-1"];

const base = {
  id: "q-1",
  missionId: "pcs",
  subjectId: "gs",
  topicId: "polity",
  stem: "Which source-grounded statement is correct?",
  options: [
    { id: "a", text: "Statement A" },
    { id: "b", text: "Statement B" },
    { id: "c", text: "Statement C" },
    { id: "d", text: "Statement D" },
  ],
  correctOptionId: "b",
  questionType: "concept",
  explanation: "The supplied source evidence supports option B.",
  sourceRefs: sourceIds,
  sourceChunkRefs: chunkIds,
};

const valid = validateAuthoredQuestion(base, { sourceIds, chunkIds, existingQuestions: [] });
if (!valid.valid) throw new Error(valid.reason);

const admitted = admitAuthoredQuestion([], base, { sourceIds, chunkIds });
if (admitted.questions.length !== 1) throw new Error("Valid question was not admitted.");

const duplicate = validateAuthoredQuestion({ ...base, id: "q-2" }, {
  sourceIds, chunkIds, existingQuestions: admitted.questions,
});
if (duplicate.valid || !duplicate.duplicateId) throw new Error("Duplicate question was not blocked.");

const missingExplanation = validateAuthoredQuestion({ ...base, id: "q-3", explanation: "" }, {
  sourceIds, chunkIds, existingQuestions: [],
});
if (missingExplanation.valid) throw new Error("Missing explanation was not blocked.");

const missingEvidence = validateAuthoredQuestion({ ...base, id: "q-4", sourceChunkRefs: [] }, {
  sourceIds, chunkIds, existingQuestions: [],
});
if (missingEvidence.valid) throw new Error("Missing source evidence was not blocked.");

console.log("question authoring validation passed");
