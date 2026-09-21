export const courseSectionNames = [
  "core",
  "crux",
  "details",
  "facts",
  "mcqTargets",
  "revisionPoints",
];

export const courseContentSchema = {
  id: "string",
  missionId: "string",
  title: "string",
  kind: "course | subject | topic | lesson",
  body: "string",
  sections: {
    core: [],
    crux: [],
    details: [],
    facts: [],
    mcqTargets: [],
    revisionPoints: [],
  },
  sourceRefs: [],
  sourceChunkRefs: [],
  evidenceLayers: [],
  sourceUrls: [],
  status: "draft | reviewed",
  createdAt: 0,
};

export function createEvidenceBlock({
  text = "",
  sourceId = "",
  chunkId = "",
  evidenceLayer = "user-source",
  sourceUrl = "",
}) {
  const cleanText = String(text || "").trim();
  if (!cleanText) return null;
  return {
    text: cleanText,
    sourceRefs: sourceId ? [sourceId] : [],
    sourceChunkRefs: chunkId ? [chunkId] : [],
    evidenceLayer,
    sourceUrl: sourceUrl || "",
  };
}

export function createCourseContent({
  missionId,
  title,
  kind = "lesson",
  body = "",
  sections = {},
  sourceRefs = [],
  sourceChunkRefs = [],
  evidenceLayers = [],
  sourceUrls = [],
  status = "draft",
}) {
  if (!missionId || !String(title || "").trim()) return null;
  const normalizedSections = Object.fromEntries(
    courseSectionNames.map((name) => [
      name,
      Array.isArray(sections[name]) ? sections[name].filter(Boolean) : [],
    ])
  );
  const allBlocks = courseSectionNames.flatMap((name) => normalizedSections[name]);
  return {
    id: crypto.randomUUID(),
    missionId,
    title: String(title).trim(),
    kind,
    body: String(body || "").trim(),
    sections: normalizedSections,
    sourceRefs: [...new Set([
      ...sourceRefs,
      ...allBlocks.flatMap((item) => item.sourceRefs || []),
    ])],
    sourceChunkRefs: [...new Set([
      ...sourceChunkRefs,
      ...allBlocks.flatMap((item) => item.sourceChunkRefs || []),
    ])],
    evidenceLayers: [...new Set([
      ...evidenceLayers,
      ...allBlocks.map((item) => item.evidenceLayer).filter(Boolean),
    ])],
    sourceUrls: [...new Set([
      ...sourceUrls,
      ...allBlocks.map((item) => item.sourceUrl).filter(Boolean),
    ])],
    status,
    createdAt: Date.now(),
  };
}

export function courseContentForMission(content, missionId) {
  return (Array.isArray(content) ? content : []).filter((item) => item?.missionId === missionId);
}
