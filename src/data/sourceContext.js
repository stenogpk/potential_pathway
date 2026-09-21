import { searchSources } from "./sourceSearch.js";

export function buildSourceContext(chunks, query, { missionId = null, limit = 5 } = {}) {
  const matches = searchSources(chunks, query, { missionId, limit });
  return matches.map((chunk) => ({
    chunkId: chunk.id,
    sourceId: chunk.sourceId,
    locator: chunk.locator,
    text: chunk.text,
    score: chunk.score,
    evidenceLayer: chunk.evidenceLayer || "user-source",
    sourceUrl: chunk.sourceUrl || null,
    publisher: chunk.publisher || null,
  }));
}

export function sourceContextText(context) {
  return (Array.isArray(context) ? context : [])
    .map((item) => "[" + item.sourceId + " · " + item.locator + " · " + (item.evidenceLayer || "user-source") + "] " + item.text)
    .join("\n\n");
}
