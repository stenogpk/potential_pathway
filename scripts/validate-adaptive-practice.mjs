import { selectNextQuestion } from "../src/data/adaptiveQuestionSelector.js";
import { applyAttemptToRevision } from "../src/data/retentionEngine.js";
const questions=[
 {id:"q1",topicId:"weak",questionType:"concept"},
 {id:"q2",topicId:"new",questionType:"pyq"},
];
const picked=selectNextQuestion(questions,{attempts:[{questionId:"q1",isCorrect:false}],revisions:[{topicId:"weak",lastResult:"incorrect"}]});
if(picked.id!=="q1") throw new Error("Adaptive selector failed to prioritize weak/error question.");
const card={id:"r1",missionId:"pcs",topicId:"weak",repetitions:0,intervalDays:0,dueAt:Date.now()};
const weak=applyAttemptToRevision(card,{isCorrect:false,errorType:"concept-confusion"});
if(weak.lastErrorType!=="concept-confusion"||weak.intervalDays!==1) throw new Error("Retention targeting failed.");
console.log("Adaptive practice validation passed.");
