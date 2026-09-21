export const courseContentSchema = {
  id: "string",
  missionId: "string",
  title: "string",
  kind: "course | subject | topic | lesson",
  body: "string",
  sourceRefs: [],
  sourceChunkRefs: [],
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
    status,
    createdAt: Date.now(),
  };
}

export function courseContentForMission(content, missionId) {
  return (Array.isArray(content) ? content : []).filter((item) => item?.missionId === missionId);
}
