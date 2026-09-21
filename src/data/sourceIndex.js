import { transitionSource } from "./sourceLifecycle.js";
import { ingestTextSource, isSupportedTextFile, isPdfFile, ingestPdfSourceWithEvidence } from "./sourceIngestion.js";

export async function indexSource(source, file) {
  if (isPdfFile(file) || isPdfFile({ name: source?.fileName, type: source?.mimeType })) {
    const result = await ingestPdfSourceWithEvidence({ source, file });
    const indexedSource = transitionSource(source, "indexed");
    if (indexedSource.status !== "indexed") throw new Error("Source lifecycle rejected indexing.");
    return {
      source: { ...indexedSource, pageCount: result.pageCount },
      chunks: result.chunks,
      chunkCount: result.chunkCount,
    };
  }

  if (isSupportedTextFile(file)) {
    const result = await ingestTextSource({ source, file });
    const indexedSource = transitionSource(source, "indexed");
    if (indexedSource.status !== "indexed") throw new Error("Source lifecycle rejected indexing.");
    return { source: indexedSource, chunks: result.chunks, chunkCount: result.chunkCount };
  }

  throw new Error("This source format is not supported for local indexing.");
}

export async function indexTextSource(source, file) {
  return indexSource(source, file);
}
