import { indexTextSource } from "./sourceIndex.js";

export function createSourceRecord({ title, missionId, file = null }) {
  const clean = String(title || file?.name || "").trim();
  if (!clean || !missionId) return null;
  return {
    id: crypto.randomUUID(),
    title: clean,
    missionId,
    type: file?.type || "reference",
    authority: "user-provided",
    status: file ? "file-selected" : "pending",
    fileName: file?.name || null,
    fileSize: file?.size || null,
    mimeType: file?.type || null,
    sourceRefs: [],
    addedAt: Date.now(),
  };
}

export function isTextSource(source) {
  const name = String(source?.fileName || "").toLowerCase();
  return name.endsWith(".txt") || name.endsWith(".md");
}

export async function prepareSource(source, file) {
  if (!isTextSource(source)) return { source, chunks: [], chunkCount: 0, indexed: false };
  return { ...(await indexTextSource(source, file)), indexed: true };
}

export function sourceChunkCount(chunks, sourceId) {
  return Array.isArray(chunks) ? chunks.filter((chunk) => chunk.sourceId === sourceId).length : 0;
}
