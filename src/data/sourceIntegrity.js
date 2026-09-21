export function sourceUsageCount(sourceId, courseNodes = [], questions = []) { return courseNodes.filter((n) => n.sourceRefs?.includes(sourceId)).length + questions.filter((q) => q.sourceRefs?.includes(sourceId)).length; }
export function canArchiveSource(sourceId, courseNodes = [], questions = []) { return sourceUsageCount(sourceId, courseNodes, questions) >= 0; }
export function archiveSource(source) { return { ...source, status: "archived", archivedAt: Date.now(), updatedAt: Date.now() }; }
export function activeSources(sources, missionId) { return sources.filter((s) => s.missionId === missionId && s.status !== "archived"); }
