export function ingestionCapability(fileName = "") { const ext = fileName.toLowerCase().split(".").pop(); if (["txt","md"].includes(ext)) return "client-text"; if (ext === "pdf") return "pdf-ready"; return "metadata-only"; }
export function normalizeExtractedText(text = "") { return text.replace(/\\r\\n/g, "\\n").replace(/[ \\t]+/g, " ").replace(/\\n{3,}/g, "\\n\\n").trim(); }
export function buildIngestionRecord(source, capability) { return { sourceId: source.id, status: "pending", capability, startedAt: null, completedAt: null, error: null }; }
