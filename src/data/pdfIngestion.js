import { createContentChunk } from "./contentModel.js";
import { splitTextIntoChunks } from "./textExtractor.js";

export const supportedPdfExtensions = [".pdf"];

export function isPdfFile(file) {
  const name = String(file?.name || "").toLowerCase();
  return supportedPdfExtensions.some((extension) => name.endsWith(extension)) ||
    String(file?.type || "").toLowerCase() === "application/pdf";
}

export async function extractPdfPages(file) {
  if (!isPdfFile(file)) throw new Error("A PDF source is required.");
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("A readable PDF File-like object is required.");
  }

  // Load PDF.js only when a PDF is actually opened. Keeping it out of the initial
  // bundle avoids Android WebView startup failures on environments missing PDF.js globals.
  const [{ default: pdfjsLib }, workerModule] = await Promise.all([
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => item?.str || "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (text) pages.push({ page: pageNumber, text });
  }

  if (!pages.length) {
    throw new Error("The PDF has no extractable text. A scanned/image-only PDF needs OCR before indexing.");
  }

  return { pages, pageCount: pdf.numPages };
}

export async function ingestPdfSource({ source, file, maxLength = 1400 }) {
  if (!source?.id || !source?.missionId) throw new Error("Source identity is required.");

  const { pages, pageCount } = await extractPdfPages(file);
  const chunks = [];

  pages.forEach(({ page, text }) => {
    const parts = splitTextIntoChunks(text, { maxLength });
    parts.forEach((part, index) => {
      const chunk = createContentChunk({
        id: source.id + ":p" + page + ":chunk-" + (index + 1),
        sourceId: source.id,
        missionId: source.missionId,
        locator: (source.fileName || file.name) + "#page-" + page,
        text: part,
        page,
        order: chunks.length,
      });
      if (chunk) chunks.push(chunk);
    });
  });

  if (!chunks.length) throw new Error("PDF extraction produced no valid content chunks.");
  return { chunks, chunkCount: chunks.length, pageCount };
}
