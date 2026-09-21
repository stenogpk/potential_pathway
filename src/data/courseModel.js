import { sourceSchema, createSource } from "./sourceModel.js";

export { sourceSchema, createSource };

export const emptyCourse = {
  missionId: null,
  sourceIds: [],
  subjects: [],
  topics: [],
  subtopics: [],
};

export const courseEntitySchema = {
  source: sourceSchema,
  subject: {
    id: "string",
    missionId: "string",
    name: "string",
    weight: null,
  },
  topic: {
    id: "string",
    parentId: "string | null",
    subjectId: "string",
    name: "string",
    sourceRefs: [],
    status: "not-started | learning | revision-ready | completed",
  },
  subtopic: {
    id: "string",
    parentId: "string | null",
    topicId: "string",
    name: "string",
    core: "",
    crux: "",
    sourceRefs: [],
  },
};

export const courseStatusLabels = {
  "not-started": "Not started",
  learning: "Learning",
  "revision-ready": "Revision ready",
  completed: "Completed",
};

export function createCourseNode({ missionId, subjectId = null, topicId = null, parentId = null, name, kind }) {
  return {
    id: crypto.randomUUID(),
    missionId,
    subjectId,
    topicId,
    parentId,
    name,
    kind,
    status: "not-started",
    sourceRefs: [],
    createdAt: Date.now(),
  };
}

export function updateCourseNode(nodes, nodeId, patch) {
  return nodes.map((node) => node.id === nodeId ? { ...node, ...patch, updatedAt: Date.now() } : node);
}

export function courseTree(nodes, missionId) {
  return nodes
    .filter((node) => node.missionId === missionId)
    .map((node) => ({ ...node, children: nodes.filter((child) => child.parentId === node.id) }));
}
