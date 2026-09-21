export const emptyCourse = {
  missionId: null,
  sourceIds: [],
  subjects: [],
  topics: [],
  subtopics: [],
};

export const courseEntitySchema = {
  source: {
    id: "string",
    missionId: "string",
    title: "string",
    type: "official-pdf | reference | notes | other",
    authority: "official | user-provided | secondary",
    status: "pending | indexed | active | archived",
  },
  subject: {
    id: "string",
    missionId: "string",
    name: "string",
    weight: null,
  },
  topic: {
    id: "string",
    subjectId: "string",
    name: "string",
    sourceRefs: [],
    status: "not-started | learning | revision-ready | completed",
  },
  subtopic: {
    id: "string",
    topicId: "string",
    name: "string",
    core: "",
    crux: "",
    sourceRefs: [],
  },
};

export function createSource({ missionId, title, type = "reference", authority = "user-provided" }) {
  return {
    id: crypto.randomUUID(),
    missionId,
    title,
    type,
    authority,
    status: "pending",
    createdAt: Date.now(),
  };
}

export const courseStatusLabels = {
  "not-started": "Not started",
  learning: "Learning",
  "revision-ready": "Revision ready",
  completed: "Completed",
};

export function createCourseNode({ missionId, subjectId = null, topicId = null, name, kind }) {
  return {
    id: crypto.randomUUID(),
    missionId,
    subjectId,
    topicId,
    name,
    kind,
    status: "not-started",
    sourceRefs: [],
    createdAt: Date.now(),
  };
}
