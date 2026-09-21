export const sourceStatuses = ["pending","file-selected","indexed","active","archived"];
export const sourceTypes = ["official-pdf","reference","notes","other"];
export function createSourceRecord({ missionId, title, fileName = null, fileSize = null, mimeType = null, authority = "user-provided", type = "reference" }) {
  return { id: crypto.randomUUID(), missionId, title, fileName, fileSize, mimeType, authority, type, status: fileName ? "file-selected" : "pending", sourceRefs: [], addedAt: Date.now() };
}
export function sourceLabel(source) { return source.fileName || source.title || "Untitled source"; }
export function sourceMatches(source, query = "") { const q = query.trim().toLowerCase(); return !q || [source.title, source.fileName, source.type, source.authority].filter(Boolean).some((v) => v.toLowerCase().includes(q)); }
