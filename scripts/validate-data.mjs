import { emptyCourse, courseEntitySchema } from "../src/data/courseModel.js";
import { questionSchema, attemptSchema, revisionSchema } from "../src/data/questions.js";
import { missions } from "../src/data/missions.js";
import { sourceStatuses, sourceTypes } from "../src/data/sourceModel.js";
import { contentIndexSchema } from "../src/data/contentIndex.js";
import { searchSources } from "../src/data/sourceSearch.js";
import { sourceStats } from "../src/data/sourceStats.js";

const required = (obj, keys, label) => {
  for (const key of keys) {
    if (!(key in obj)) throw new Error(`${label} is missing "${key}"`);
  }
};

required(courseEntitySchema.source, ["id","missionId","title","type","authority","status"], "source schema");
required(courseEntitySchema.subject, ["id","missionId","name","weight"], "subject schema");
required(courseEntitySchema.topic, ["id","subjectId","name","sourceRefs","status"], "topic schema");
required(courseEntitySchema.subtopic, ["id","topicId","name","core","crux","sourceRefs"], "subtopic schema");
required(questionSchema, ["id","missionId","subjectId","topicId","sourceRefs","stem","options","correctOptionId","explanation","difficulty","tags"], "question schema");
required(attemptSchema, ["id","questionId","missionId","selectedOptionId","isCorrect","timeSeconds","attemptedAt"], "attempt schema");
required(revisionSchema, ["id","missionId","topicId","sourceRefs","dueAt","intervalDays","ease","repetitions","lastResult"], "revision schema");
if (!sourceStatuses.includes("indexed") || !sourceStatuses.includes("active")) throw new Error("Source lifecycle is incomplete.");
if (!sourceTypes.includes("official-pdf")) throw new Error("Source types are incomplete.");
required(contentIndexSchema, ["sourceId","missionId","page","heading","text","contentType","createdAt"], "content index schema");
if (typeof searchSources !== "function" || typeof sourceStats !== "function") throw new Error("Source utilities are not loadable.");

if (!Array.isArray(missions) || missions.length < 2) {
  throw new Error("Expected at least two configured missions.");
}
if (!emptyCourse || !Array.isArray(emptyCourse.sourceIds) || !Array.isArray(emptyCourse.subjects)) {
  throw new Error("emptyCourse is not shaped correctly.");
}
if (missions.some((m) => !m.id || !m.title || !m.status)) {
  throw new Error("Every mission needs id, title and status.");
}

console.log(`PP data validation passed: ${missions.length} missions, course/MCQ/revision schemas OK.`);
