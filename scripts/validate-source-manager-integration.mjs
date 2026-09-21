import { prepareSource, createSourceRecord, isPdfSource } from "../src/data/sourceManager.js";

const file = {
  name: "notes.txt",
  size: 42,
  type: "text/plain",
  async text() { return "Alpha topic\n\nBeta topic"; },
};
const source = createSourceRecord({ title: "Notes", missionId: "pcs", file });
const result = await prepareSource(source, file);

if (!result.indexed || result.source.status !== "indexed") throw new Error("Text source was not indexed.");
if (result.chunkCount !== result.chunks.length || result.chunkCount < 1) throw new Error("Chunk count mismatch.");
if (!result.chunks.every((chunk) => chunk.sourceId === source.id && chunk.missionId === "pcs")) {
  throw new Error("Chunk provenance is incomplete.");
}

const pdf = createSourceRecord({
  title: "PDF",
  missionId: "pcs",
  file: { name: "book.pdf", size: 10, type: "application/pdf" },
});
if (!isPdfSource(pdf) || pdf.status !== "file-selected") {
  throw new Error("PDF source must be recognized and ready for browser indexing.");
}

console.log("Source manager ingestion integration validation passed.");
