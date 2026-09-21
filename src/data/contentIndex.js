export const contentIndexSchema = { sourceId: "string", missionId: "string", page: 0, heading: "", text: "", contentType: "text", createdAt: 0 };
export function createContentChunk({ sourceId, missionId, page = 0, heading = "", text, contentType = "text" }) { return { id: crypto.randomUUID(), sourceId, missionId, page, heading, text, contentType, createdAt: Date.now() }; }
export function chunksForSource(chunks, sourceId) { return chunks.filter((chunk) => chunk.sourceId === sourceId); }
export function searchContent(chunks, query) { const q = query.trim().toLowerCase(); if (!q) return []; return chunks.filter((chunk) => chunk.text.toLowerCase().includes(q) || chunk.heading.toLowerCase().includes(q)); }
