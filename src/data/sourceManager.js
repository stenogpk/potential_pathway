import { indexSource } from "./sourceIndex.js";
import { saveSourceFile } from "./sourceFileStore.js";

export function createSourceRecord({ title, missionId, file = null }) {
  const clean = String(title || file?.name || "").trim();
  if (!clean || !missionId) return null;
  const isPdf = String(file?.name || "").toLowerCase().endsWith(".pdf") ||
    String(file?.type || "").toLowerCase() === "application/pdf";

  return {
    id: crypto.randomUUID(),
    title: clean,
    missionId,
    type: isPdf ? "official-pdf" : (file?.type || "reference"),
    authority: "user-provided",
    status: file ? "file-selected" : "pending",
    fileName: file?.name || null,
    fileSize: file?.size || null,
    mimeType: file?.type || null,
    url: null,
    publisher: null,
    verification: null,
    sourceRefs: [],
    addedAt: Date.now(),
  };
}

export function isTextSource(source) {
  const name = String(source?.fileName || "").toLowerCase();
  return name.endsWith(".txt") || name.endsWith(".md");
}

export function isPdfSource(source) {
  const name = String(source?.fileName || "").toLowerCase();
  return name.endsWith(".pdf") || source?.mimeType === "application/pdf";
}

export function isIndexableSource(source) {
  return isTextSource(source) || isPdfSource(source);
}

export async function prepareSource(source, file) {
  if (!isIndexableSource(source)) return { source, chunks: [], chunkCount: 0, indexed: false };
  const indexed = await indexSource(source, file);
  await saveSourceFile(source.id, file);
  return { ...indexed, indexed: true, originalFileStored: true };
}

export function sourceChunkCount(chunks, sourceId) {
  return Array.isArray(chunks) ? chunks.filter((chunk) => chunk.sourceId === sourceId).length : 0;
}
