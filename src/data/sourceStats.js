export function sourceStats(sources, missionId = null) {
  const rows = missionId ? sources.filter((source) => source.missionId === missionId) : sources;
  return {
    total: rows.length,
    pending: rows.filter((s) => s.status === "pending").length,
    fileSelected: rows.filter((s) => s.status === "file-selected").length,
    indexed: rows.filter((s) => s.status === "indexed").length,
    active: rows.filter((s) => s.status === "active").length,
    archived: rows.filter((s) => s.status === "archived").length,
  };
}
