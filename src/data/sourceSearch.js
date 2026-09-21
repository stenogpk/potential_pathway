import { normalizeContentChunks } from "./contentModel.js";

export function searchSources(chunks, query, { missionId = null, limit = 8 } = {}) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return [];
  const rows = normalizeContentChunks(chunks)
    .filter((chunk) => !missionId || chunk.missionId === missionId)
    .map((chunk) => {
      const haystack = chunk.text.toLowerCase();
      const terms = needle.split(/\s+/).filter(Boolean);
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      return { ...chunk, score };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order);
  return rows.slice(0, limit);
}
