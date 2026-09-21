export const contentChunkSchema = {
  id: "string",
  sourceId: "string",
  missionId: "string",
  locator: "string",
  text: "string",
  page: "number | null",
  order: "number",
};

export function createContentChunk({ id, sourceId, missionId, locator = "", text, page = null, order = 0 }) {
  const clean = String(text || "").trim();
  if (!id || !sourceId || !missionId || !clean) return null;
  return { id, sourceId, missionId, locator, text: clean, page, order };
}

export function normalizeContentChunks(chunks) {
  if (!Array.isArray(chunks)) return [];
  return chunks
    .filter((chunk) => chunk && chunk.id && chunk.sourceId && chunk.missionId && String(chunk.text || "").trim())
    .map((chunk, index) => ({
      ...chunk,
      text: String(chunk.text).trim(),
      page: Number.isFinite(chunk.page) ? chunk.page : null,
      order: Number.isFinite(chunk.order) ? chunk.order : index,
    }));
}
