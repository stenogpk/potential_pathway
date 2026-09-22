export function buildChatEvidence({ missionId, query, chunks = [], searchFn }) {
  const clean = String(query || "").trim();
  if (!missionId || !clean) return { status: "invalid", matches: [] };
  const matches = (searchFn ? searchFn(chunks, clean, { missionId, limit: 4 }) : []).slice(0, 4);
  return { status: matches.length ? "grounded" : "needs-external-verification", matches };
}
