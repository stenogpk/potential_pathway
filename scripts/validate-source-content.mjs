import { createContentChunk, normalizeContentChunks } from "../src/data/contentModel.js";
import { normalizeText, splitTextIntoChunks } from "../src/data/textExtractor.js";
import { searchSources } from "../src/data/sourceSearch.js";

const raw = "  First line\r\n\r\nSecond line  ";
if (normalizeText(raw) !== "First line\n\nSecond line") throw new Error("normalizeText failed");

const parts = splitTextIntoChunks("Alpha topic\n\nBeta topic\n\nGamma topic", { maxLength: 11 });
if (parts.length !== 3) throw new Error("splitTextIntoChunks failed");

const chunk = createContentChunk({ id: "c1", sourceId: "s1", missionId: "pcs", text: parts[0], order: 0 });
if (!chunk) throw new Error("createContentChunk failed");

const normalized = normalizeContentChunks([chunk, null, { id: "bad" }]);
if (normalized.length !== 1) throw new Error("normalizeContentChunks failed");

const hits = searchSources([
  chunk,
  { id: "c2", sourceId: "s2", missionId: "chemistry", text: "Beta chemistry", order: 1 },
], "Alpha", { missionId: "pcs" });
if (hits.length !== 1 || hits[0].id !== "c1") throw new Error("searchSources failed");

console.log("PP source content validation passed.");
