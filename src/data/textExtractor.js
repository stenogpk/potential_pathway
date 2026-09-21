export function normalizeText(text) {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function splitTextIntoChunks(text, { maxLength = 1200 } = {}) {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  const paragraphs = normalized.split(/\n\s*\n/).filter(Boolean);
  const chunks = [];
  let current = "";
  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (current && candidate.length > maxLength) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}
