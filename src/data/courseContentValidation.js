export function validateCourseContentProvenance(content, sourceIds = [], chunkIds = []) {
  if (!content?.id || !content?.missionId || !content?.title || !String(content.body || "").trim()) {
    return { valid: false, reason: "Course content identity or body is incomplete." };
  }
  if (!Array.isArray(content.sourceRefs) || content.sourceRefs.length === 0) {
    return { valid: false, reason: "Course content has no source reference." };
  }

  const allowedSources = new Set(sourceIds);
  const unknownSources = content.sourceRefs.filter((id) => !allowedSources.has(id));
  if (unknownSources.length) {
    return { valid: false, reason: "Course content references an unknown source." };
  }

  const allowedChunks = new Set(chunkIds);
  if (Array.isArray(content.sourceChunkRefs) && content.sourceChunkRefs.length) {
    const unknownChunks = content.sourceChunkRefs.filter((id) => !allowedChunks.has(id));
    if (unknownChunks.length) {
      return { valid: false, reason: "Course content references an unknown source chunk." };
    }
  }

  return { valid: true, reason: "" };
}

export function filterValidCourseContent(content, sourceIds, chunkIds) {
  return (Array.isArray(content) ? content : []).filter((item) =>
    validateCourseContentProvenance(item, sourceIds, chunkIds).valid
  );
}
