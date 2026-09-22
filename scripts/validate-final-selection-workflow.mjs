import fs from "node:fs";
import { applyAttemptToRevision } from "../src/data/retentionEngine.js";
import { validateAndAdmitGroundedQuestion } from "../src/data/mcqBank.js";

const main = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const requiredUiContracts = [
  'QuestionStudio',
  'validateAndAdmitGroundedQuestion',
  'applyAttemptToRevision',
  'setPanel("authoring")',
];
for (const contract of requiredUiContracts) {
  if (!main.includes(contract)) throw new Error(`Missing UI integration contract: ${contract}`);
}

const card = {
  id: "revision-1",
  missionId: "pcs",
  topicId: "polity",
  repetitions: 0,
  intervalDays: 0,
  dueAt: Date.now(),
};
const weak = applyAttemptToRevision(card, { isCorrect: false, errorType: "concept-confusion" });
if (weak.lastErrorType !== "concept-confusion" || weak.lastResult !== "incorrect" || weak.intervalDays !== 1) {
  throw new Error("Incorrect MCQ attempt did not create the targeted retention state.");
}
const recovered = applyAttemptToRevision(weak, { isCorrect: true });
if (recovered.lastErrorType !== null || recovered.lastResult !== "correct") {
  throw new Error("Correct re-test did not clear the retention error.");
}

const question = {
  id: "q-final-1",
  missionId: "pcs",
  topicId: "polity",
  stem: "Which source-backed option is correct?",
  explanation: "The selected answer is supported by the cited source chunk.",
  options: [
    { id: "a", text: "Correct" },
    { id: "b", text: "Incorrect" },
    { id: "c", text: "Incorrect" },
    { id: "d", text: "Incorrect" },
  ],
  correctOptionId: "a",
  questionType: "concept",
  difficulty: "easy",
  sourceRefs: ["source-1"],
  sourceChunkRefs: ["chunk-1"],
};
const admitted = validateAndAdmitGroundedQuestion([], question, ["source-1"], ["chunk-1"]);
if (!admitted.valid || admitted.questions.length !== 1) throw new Error("Valid grounded question was not admitted.");
const duplicate = validateAndAdmitGroundedQuestion(admitted.questions, { ...question, id: "q-final-2" }, ["source-1"], ["chunk-1"]);
if (duplicate.valid) throw new Error("Duplicate grounded question was admitted.");

console.log("Final selection workflow validation passed.");
