export const courseContentSchema = {
  id: "string",
  missionId: "string",
  title: "string",
  kind: "course | subject | topic | lesson",
  body: "string",
  sourceRefs: [],
  sourceChunkRefs: [],
  evidenceLayers: [],
  sourceUrls: [],
  status: "draft | reviewed",
  createdAt: 0,
};

export function createCourseContent({
  missionId,
  title,
  kind = "lesson",
  body = "",
  sourceRefs = [],
  sourceChunkRefs = [],
  evidenceLayers = [],
  sourceUrls = [],
  status = "draft",
}) {
  if (!missionId || !String(title || "").trim()) return null;
  return {
    id: crypto.randomUUID(),
    missionId,
    title: String(title).trim(),
    kind,
    body: String(body || "").trim(),
    sourceRefs: [...new Set(sourceRefs)],
    sourceChunkRefs: [...new Set(sourceChunkRefs)],
    evidenceLayers: [...new Set(evidenceLayers)],
    sourceUrls: [...new Set(sourceUrls)],
    status,
    createdAt: Date.now(),
  };
}

export function courseContentForMission(content, missionId) {
  return (Array.isArray(content) ? content : []).filter((item) => item?.missionId === missionId);
}
