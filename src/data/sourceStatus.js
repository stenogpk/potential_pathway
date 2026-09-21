export function canAdvanceSource(source) { return source.status === "file-selected" || source.status === "indexed"; }
export function advanceSourceStatus(source) { if (source.status === "pending") return { ...source, status: "file-selected" }; if (source.status === "file-selected") return source; if (source.status === "indexed") return { ...source, status: "active" }; return source; }
