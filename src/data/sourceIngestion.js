import { createContentChunk } from "./contentModel.js";
import { splitTextIntoChunks } from "./textExtractor.js";
import { ingestPdfSource, isPdfFile } from "./pdfIngestion.js";

export const supportedTextExtensions = [".txt", ".md"];

export function isSupportedTextFile(file) {
  const name = String(file?.name || "").toLowerCase();
  return supportedTextExtensions.some((extension) => name.endsWith(extension));
}

export { isPdfFile };

export async function extractTextFile(file) {
  if (!isSupportedTextFile(file)) {
    throw new Error("Only TXT and Markdown sources are supported by the local text ingester.");
  }
  if (!file || typeof file.text !== "function") {
    throw new Error("A readable File-like object is required.");
  }
  const text = await file.text();
  if (!String(text).trim()) throw new Error("Source file contains no readable text.");
  return text;
}

function chunkEvidence(source) {
  return {
    evidenceLayer: source?.authority === "official" ? "official" : "user-source",
    sourceUrl: source?.url || null,
    publisher: source?.publisher || null,
  };
}

export async function ingestTextSource({ source, file, maxLength = 1200 }) {
  if (!source?.id || !source?.missionId) throw new Error("Source identity is required.");
  const rawText = await extractTextFile(file);
  const parts = splitTextIntoChunks(rawText, { maxLength });
  if (!parts.length) throw new Error("No indexable text chunks were produced.");

  const evidence = chunkEvidence(source);
  const chunks = parts.map((text, index) => createContentChunk({
    id: source.id + ":chunk-" + (index + 1),
    sourceId: source.id,
    missionId: source.missionId,
    locator: (source.fileName || file.name) + "#chunk-" + (index + 1),
    text,
    order: index,
    ...evidence,
  })).filter(Boolean);

  if (!chunks.length) throw new Error("Text extraction produced no valid content chunks.");
  return { chunks, chunkCount: chunks.length };
}

export async function ingestPdfSourceWithEvidence({ source, file, maxLength = 1400 }) {
  const result = await ingestPdfSource({ source, file, maxLength });
  const evidence = chunkEvidence(source);
  return {
    ...result,
    chunks: result.chunks.map((chunk) => ({ ...chunk, ...evidence })),
  };
}

export { ingestPdfSource };
