import { transitionSource } from "./sourceLifecycle.js";
import { ingestTextSource } from "./sourceIngestion.js";

export async function indexTextSource(source, file) {
  const result = await ingestTextSource({ source, file });
  const indexedSource = transitionSource(source, "indexed");
  if (indexedSource.status !== "indexed") {
    throw new Error("Source lifecycle rejected indexing.");
  }
  return { source: indexedSource, chunks: result.chunks, chunkCount: result.chunkCount };
}
