import { isSupportedTextFile } from "../src/data/sourceIngestion.js";
import { indexTextSource } from "../src/data/sourceIndex.js";

const file = {
  name: "sample.md",
  async text() { return "Alpha topic\\n\\nBeta topic\\n\\nGamma topic"; },
};

if (!isSupportedTextFile(file)) throw new Error("TXT/MD support failed");
if (isSupportedTextFile({ name: "sample.pdf" })) throw new Error("PDF must not use local text ingester");

const source = {
  id: "s1",
  missionId: "pcs",
  fileName: file.name,
  status: "file-selected",
};

const result = await indexTextSource(source, file);
if (result.source.status !== "indexed") throw new Error("Source was not indexed after successful extraction");
if (result.chunkCount !== 1) throw new Error("Unexpected chunk count");
if (!result.chunks[0].text.includes("Alpha topic")) throw new Error("Chunk text missing");

let failed = false;
try { await indexTextSource(source, { name: "bad.pdf", async text() { return "x"; } }); }
catch { failed = true; }
if (!failed) throw new Error("Unsupported PDF was incorrectly ingested as text");

console.log("PP source ingestion validation passed.");
