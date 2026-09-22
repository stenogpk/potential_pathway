import { applyAttemptToRevision, classifyAttemptError } from "../src/data/retentionEngine.js";

const card = { id:"r1", missionId:"pcs", topicId:"t1", repetitions:1, lastResult:"correct", dueAt:Date.now()-1000 };
const weak = applyAttemptToRevision(card,{isCorrect:false,errorType:"concept-confusion"});
if (weak.lastResult !== "incorrect" || weak.lastErrorType !== "concept-confusion" || weak.intervalDays !== 1) throw new Error("Incorrect attempt did not create a targeted weak revision.");
const recovered = applyAttemptToRevision(weak,{isCorrect:true,now:Date.now()});
if (recovered.lastResult !== "correct" || recovered.repetitions < 1) throw new Error("Correct re-test did not recover the revision card.");
if (classifyAttemptError({isCorrect:true,errorType:"knowledge-gap"}) !== null) throw new Error("Correct attempts must not retain an error type.");
console.log("retention UI contract passed");
