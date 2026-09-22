import { createAiDraftRequest, validateAiDraftEvidence } from "../src/data/aiGateway.js";
const chunks=[{id:"c1",sourceId:"s1",missionId:"pcs",text:"Official evidence",evidenceLayer:"official"}];
const ready=createAiDraftRequest({missionId:"pcs",topic:"Polity",chunks});
if(!validateAiDraftEvidence(ready,chunks).valid) throw new Error("Grounded AI request was rejected.");
const blocked=createAiDraftRequest({missionId:"pcs",topic:"Missing",chunks:[]});
if(validateAiDraftEvidence(blocked,[]).valid) throw new Error("AI generation must block without evidence.");
console.log("Production batch validation passed.");
