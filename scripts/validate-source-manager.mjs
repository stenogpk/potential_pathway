import { createSourceRecord, isTextSource, sourceChunkCount } from "../src/data/sourceManager.js";

const file = { name: "syllabus.md", size: 120, type: "text/markdown" };
const source = createSourceRecord({ title: "", missionId: "pcs", file });

if (!source || source.status !== "file-selected" || source.fileName !== "syllabus.md") {
  throw new Error("Source record creation failed.");
}
if (!isTextSource(source)) throw new Error("Markdown source was not detected.");
if (isTextSource({ fileName: "syllabus.pdf" })) throw new Error("PDF must not be treated as text.");
if (sourceChunkCount([{ sourceId: source.id }, { sourceId: "other" }], source.id) !== 1) {
  throw new Error("Source chunk counting failed.");
}

console.log("Source manager validation passed.");
